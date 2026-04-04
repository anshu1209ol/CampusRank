import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from "@google/genai";
import Bytez from "bytez.js";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store for async code submissions (polling architecture)
const submissionResults = new Map<string, any>();

// Try to initialize Firebase Admin — graceful fallback if creds missing
let adminDb: any = null;
let adminAuth: any = null;

try {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');

  // Use environment variables for initialization
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined;

  if (projectId) {
    const adminApp = initializeApp({
      projectId: projectId
    });
    // Use default DB regardless of env variable since the env variable is often misconfigured
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    console.log('✅ Firebase Admin initialized via environment for project:', projectId);
  } else {
    console.warn('⚠️  VITE_FIREBASE_PROJECT_ID not found in environment — admin APIs disabled');
  }
} catch (err) {
  console.warn('⚠️  Firebase Admin init failed (this is OK for local dev):', (err as Error).message);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // configure based on frontend needs, using false for now to avoid breaking React
    crossOriginEmbedderPolicy: false,
  }));
  
  app.use(cors({
    // Dynamically allow Vercel preview environments and your explicit FRONTEND_URL in production
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://campusrank.vercel.app', /\.vercel\.app$/]
      : '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.json({ limit: '1mb' })); // Prevent large payload attacks

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' }
  });

  const executeCodeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 execute requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many code execution requests. Please wait a minute.' }
  });

  app.use('/api/', apiLimiter);

  // Authentication Middleware
  const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!adminAuth) {
      // No admin SDK available — allow pass-through for local dev
      (req as any).user = { uid: 'local-dev-user' };
      return next();
    }

    try {
      // Wrap verifyIdToken with a timeout to avoid hanging when no service account
      const verifyPromise = adminAuth.verifyIdToken(token);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Token verification timeout')), 5000)
      );
      const decodedToken = await Promise.race([verifyPromise, timeoutPromise]);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      // If token verification fails or times out, allow in non-production
      if (process.env.NODE_ENV !== 'production') {
        (req as any).user = { uid: 'dev-user' };
        return next();
      }
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
  };

  // Admin Check Middleware
  const ensureAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const userDoc = await adminDb.collection('users').doc(user.uid).get();
      if (userDoc.exists && userDoc.data().role === 'admin') {
        next();
      } else {
        return res.status(403).json({ error: 'Forbidden: Requires admin role' });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Server error during authorization' });
    }
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'CampusRank API is running',
      adminEnabled: !!adminDb 
    });
  });

  // Recalculate Leaderboard (Admin only logic)
  app.post('/api/admin/recalculate-leaderboard', authenticateToken, ensureAdmin, async (req, res) => {
    if (!adminDb) {
      return res.status(503).json({ error: 'Firebase Admin not available. Add service account credentials.' });
    }

    try {
      const submissionsSnap = await adminDb.collection('submissions').get();
      const studentStats: Record<string, { name: string, college: string, points: number }> = {};

      submissionsSnap.forEach((doc: any) => {
        const data = doc.data();
        const studentId = data.studentId;
        if (!studentStats[studentId]) {
          studentStats[studentId] = { 
            name: data.studentName, 
            college: data.college || 'Unknown', 
            points: 0 
          };
        }
        studentStats[studentId].points += (data.score || 0) * 10;
      });

      const batch = adminDb.batch();
      Object.entries(studentStats).forEach(([id, stats]) => {
        const ref = adminDb.collection('leaderboard').doc(id);
        batch.set(ref, {
          studentId: id,
          studentName: stats.name,
          college: stats.college,
          totalPoints: stats.points,
          lastUpdated: new Date().toISOString()
        });
      });

      await batch.commit();
      res.json({ success: true, message: 'Leaderboard updated' });
    } catch (error) {
      console.error('Leaderboard update failed:', error);
      res.status(500).json({ error: 'Failed to update leaderboard' });
    }
  });
  // --- Helper to strip sensitive data ---
  const sanitizeProblem = (p: any, idx?: number) => {
    const sanitized = { ...p };
    if (idx !== undefined && !sanitized.id) sanitized.id = `prob_${idx + 1}`;
    
    // Create a generic placeholder if missing
    if (!sanitized.placeholder) {
      const lang = sanitized.language || 'python';
      if (lang === 'python') sanitized.placeholder = '# Write your solution here\ndef solve():\n    pass';
      else if (lang === 'java') sanitized.placeholder = 'class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}';
      else if (lang === 'cpp') sanitized.placeholder = '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}';
      else sanitized.placeholder = '// Write your solution here\nfunction solve() {\n  \n}';
    }

    // Strip out the answers/solutions
    delete sanitized.solution_code;
    delete sanitized.solutionCode;
    delete sanitized.test_cases;
    delete sanitized.testCases;
    
    return sanitized;
  };

  // --- Problems Library Endpoint ---
  app.get('/api/problems', async (req, res) => {
    try {
      let problems: any[] = [];
      
      // 1. Try Local Source (Reliable for 1000-question bulk)
      if (fs.existsSync(path.join(__dirname, 'problems.json'))) {
        const localData = JSON.parse(fs.readFileSync(path.join(__dirname, 'problems.json'), 'utf8'));
        problems = localData.map((p: any, idx: number) => {
          const sanitized = sanitizeProblem(p, idx);
          sanitized.solvers = Math.floor(Math.random() * 1000) + 100;
          return sanitized;
        });
      }

      // 2. Try Firestore Source (Merge/Sync)
      if (adminDb) {
        try {
          const snapshot = await adminDb.collection('problems').limit(10).get();
          const dbData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          // Merge logic: prefer DB docs if IDs match, otherwise append
          dbData.forEach((dp: any) => {
            const sanitizedDp = sanitizeProblem(dp);
            const idx = problems.findIndex(lp => lp.id === sanitizedDp.id || lp.title === sanitizedDp.title);
            if (idx !== -1) problems[idx] = { ...problems[idx], ...sanitizedDp };
            else problems.push(sanitizedDp);
          });
        } catch (dbErr) {
          console.warn('⚠️  Firestore fetch skipped for library (using local fallback)');
        }
      }

      res.json(problems);
    } catch (error) {
       console.error('Failed to fetch problems library:', error);
       res.status(500).json({ error: 'Data synchronization error' });
    }
  });

  // --- Single Problem Detail Endpoint ---
  app.get('/api/problems/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // 1. Try local JSON source
      if (fs.existsSync(path.join(__dirname, 'problems.json'))) {
        const localData = JSON.parse(fs.readFileSync(path.join(__dirname, 'problems.json'), 'utf8'));
        // Find by ID (id can be prob_1, prob_2 etc)
        const localProb = localData.find((p: any, idx: number) => p.id === id || `prob_${idx + 1}` === id);
        if (localProb) {
          const sanitized = sanitizeProblem(localProb);
          sanitized.solvers = Math.floor(Math.random() * 1000) + 100;
          if (!sanitized.id) sanitized.id = id;
          return res.json(sanitized);
        }
      }

      // 2. Try Firestore fallback
      if (adminDb) {
        const problemDoc = await adminDb.collection('problems').doc(id).get();
        if (problemDoc.exists) {
          const sanitized = sanitizeProblem({ id: problemDoc.id, ...problemDoc.data() });
          return res.json(sanitized);
        }
      }

      res.status(404).json({ error: 'Problem not found' });
    } catch (error) {
      console.error('Failed to fetch problem detail:', error);
      res.status(500).json({ error: 'Data fetch error' });
    }
  });

  // 1. Initial Submission Endpoint (Post to Hypervisor)
  app.post('/api/execute-code', executeCodeLimiter, authenticateToken, async (req, res) => {
    const { problemId, language, code, languageId } = req.body;
    
    let lang = language || '';
    if (languageId) {
      const idMap: Record<number, string> = { 63: 'javascript', 71: 'python', 54: 'cpp', 62: 'java' };
      lang = idMap[languageId] || lang;
    }

    if (!lang || !code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Language and code are required' });
    }

    const { exec } = await import('child_process');
    const token = Math.random().toString(36).substring(2, 15);

    try {
      // 1. Fetch Test Cases — try multiple sources
      let testCases: any[] = [];
      
      // Source A: From Firestore (if adminDb is available)
      if (problemId && typeof problemId === 'string' && adminDb) {
        try {
          const problemDoc = await adminDb.collection('problems').doc(String(problemId)).get();
          if (problemDoc.exists) {
            const data = problemDoc.data();
            testCases = data.testCases || data.test_cases || [];
          }
        } catch (dbErr) {
          console.warn('Firestore test case fetch failed:', dbErr);
        }
      }

      // Source B: From local problems.json
      if (testCases.length === 0 && problemId) {
        try {
          if (fs.existsSync(path.join(__dirname, 'problems.json'))) {
            const localData = JSON.parse(fs.readFileSync(path.join(__dirname, 'problems.json'), 'utf8'));
            const localProb = localData.find((p: any, idx: number) => p.id === problemId || `prob_${idx + 1}` === problemId);
            if (localProb && localProb.test_cases) {
              testCases = localProb.test_cases;
            }
          }
        } catch (jsonErr) {
          console.warn('Local JSON test case fetch failed:', jsonErr);
        }
      }

      // Source C: From request body (sent by frontend)
      if (testCases.length === 0 && req.body.testCases) {
        testCases = req.body.testCases;
      }
      if (testCases.length === 0 && req.body.test_cases) {
        testCases = req.body.test_cases;
      }

      let enforceOutputMatch = true;
      if (!testCases || !Array.isArray(testCases)) {
        testCases = [];
      }
      if (testCases.length === 0) {
        testCases = [{ input: '', expectedOutput: '' }];
        enforceOutputMatch = false; // Don't strictly check output if teacher provided NO test cases
      }

      // 2. Initialize submission state
      submissionResults.set(token, {
        status: 'processing',
        results: [],
        total: testCases.length,
        completed: 0
      });

      // 3. Respond with token immediately (Polling Architecture)
      res.json({ token });

      // 4. Background Execution Sequence
      (async () => {
        let containerImage = '';
        let setupCmd = '';
        let solveCmd = '';
        let fileName = '';

        if (lang === 'python' || lang === 'python3') {
          containerImage = 'python:3.9-slim';
          fileName = 'solution.py';
          setupCmd = `echo "${Buffer.from(code).toString('base64')}" | base64 -d > /tmp/${fileName}`;
          solveCmd = `python3 /tmp/${fileName}`;
        } else if (lang === 'javascript' || lang === 'nodejs') {
          containerImage = 'node:18-alpine';
          fileName = 'solution.js';
          setupCmd = `echo "${Buffer.from(code).toString('base64')}" | base64 -d > /tmp/${fileName}`;
          solveCmd = `node /tmp/${fileName}`;
        } else if (lang === 'cpp' || lang === 'c++') {
          containerImage = 'gcc:latest';
          fileName = 'solution.cpp';
          setupCmd = `echo "${Buffer.from(code).toString('base64')}" | base64 -d > /tmp/${fileName} && g++ -O2 /tmp/${fileName} -o /tmp/solution`;
          solveCmd = `/tmp/solution`;
        } else if (lang === 'java') {
          containerImage = 'openjdk:17-slim';
          fileName = 'Main.java';
          setupCmd = `echo "${Buffer.from(code).toString('base64')}" | base64 -d > /tmp/${fileName} && javac /tmp/${fileName}`;
          solveCmd = `java -cp /tmp Main`;
        } else {
          submissionResults.set(token, { status: 'error', error: 'Unsupported sandbox' });
          return;
        }

        const currentResults = [];
        for (const [idx, tc] of testCases.entries()) {
          const startTime = Date.now();
          let stdout = '';
          let stderr = '';
          let errorOccurred = false;

          try {
            const dockerCmd = `docker run -i --rm --network none --memory 256m --cpus 0.5 ${containerImage} sh -c "${setupCmd} && ${solveCmd}"`;
            const processRef = exec(dockerCmd, { timeout: 10000 });
            
            const executionPromise = new Promise((resolve) => {
              processRef.stdout?.on('data', (data) => stdout += data);
              processRef.stderr?.on('data', (data) => stderr += data);
              processRef.on('close', (code) => resolve(code));
              processRef.on('error', (err) => { stderr = err.message; errorOccurred = true; resolve(1); });
            });

            if (processRef.stdin) {
              if (tc.input) processRef.stdin.write(tc.input + '\n');
              processRef.stdin.end();
            }

            await executionPromise;
          } catch (e: any) { stderr = e.message; errorOccurred = true; }

          const duration = Date.now() - startTime;
          const cleanupOutput = stdout.trim();
          const expectedOut = tc.expectedOutput || tc.output || '';
          
          let passed = !errorOccurred && !stderr;
          if (enforceOutputMatch) {
            passed = passed && (cleanupOutput === expectedOut.trim());
          }

          currentResults.push({
            id: idx + 1,
            input: tc.input,
            expectedOutput: enforceOutputMatch ? expectedOut : 'No expected output provided',
            actualOutput: cleanupOutput,
            error: stderr || null,
            passed,
            duration
          });

          // Update real-time status
          submissionResults.set(token, {
            status: idx === testCases.length - 1 ? 'completed' : 'processing',
            results: [...currentResults],
            total: testCases.length,
            completed: currentResults.length
          });
        }
      })();
    } catch (err: any) {
      console.error('Hypervisor trigger fault:', err);
      res.status(500).json({ error: 'Hypervisor fault' });
    }
  });

  // 2. Status Check Endpoint (Polling Architecture)
  app.get('/api/check-status/:token', authenticateToken, (req, res) => {
    const { token } = req.params;
    const result = submissionResults.get(token);
    if (!result) return res.status(404).json({ error: 'Token not found or expired' });
    res.json(result);
    
    // Auto-cleanup after completion to save memory
    if (result.status === 'completed' || result.status === 'error') {
      setTimeout(() => submissionResults.delete(token), 600000); // 10 minute grace period
    }
  });

  // AI Endpoints
  const aiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 20, 
    message: { error: 'Too many AI requests. Please wait.' }
  });

  const getGeminiClient = () => {
    // using dotenv to load from .env since server.ts is launched via tsx server.ts
    // or passing directly. process.env should have it if dotenv is configured.
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('Gemini API Key missing on server');
    return new GoogleGenAI({ apiKey: key });
  };
  
  const getQwenModel = () => {
    const key = process.env.BYTEZ_API_KEY || "f6bc8c39f9d5b7ad5d930e9304e4b921";
    if (!key) throw new Error('Bytez API Key missing on server');
    const bytezSdk = new Bytez(key);
    return bytezSdk.model("Qwen/Qwen3-0.6B");
  };

  app.post('/api/ai/chat', aiLimiter, authenticateToken, async (req, res) => {
    try {
      const qwenModel = getQwenModel();
      const { error, output } = await qwenModel.run([{ role: "user", content: req.body.message }]);
      if (error) return res.status(500).json({ error });
      res.json({ output });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/ai/score-resume', aiLimiter, authenticateToken, async (req, res) => {
    try {
      const { resumeText } = req.body;
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Score the following resume on a scale of 0-100 based on industry standards for software engineering roles. 
        Resume: ${resumeText}
        Return JSON with fields: score (number), feedback (array of strings), missingKeywords (array of strings).`,
        config: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/ai/recommendations', aiLimiter, authenticateToken, async (req, res) => {
    try {
      const { studentPerformance } = req.body;
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Based on the following student performance data, recommend 3 specific topics or tests they should focus on. 
        Data: ${JSON.stringify(studentPerformance)}
        Return the response in JSON format with fields: recommendations (array of strings), reasoning (string).`,
        config: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/ai/hint', aiLimiter, authenticateToken, async (req, res) => {
    try {
      const { question, questionType } = req.body;
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `A student is working on a ${questionType} question and needs a hint (NOT the full answer). 
        Question: ${question}
        Give a subtle, educational hint that guides them toward the solution without revealing it directly. Keep it under 2 sentences.`,
      });
      res.json({ output: response.text });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // For ML dataset processing (Teacher restricted)
  app.post('/api/ai/process-dataset', aiLimiter, authenticateToken, ensureAdmin, async (req, res) => {
    try {
      const { datasetRawText, categoryContext } = req.body;
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are an intelligent data extraction pipeline for an educational platform.
        I am providing you with a raw dataset of questions in potentially messy formats (CSV, JSON, plain text).
        Your job is to parse these questions, clean them up, categorize them under "${categoryContext}", 
        and return them in a strict JSON array format.

        Dataset string length: ${datasetRawText.length}. Process the following dataset:
        """
        ${datasetRawText.substring(0, 8000)}
        """

        Parse as many clear questions as possible. Return the response as a JSON array of objects with:
        For MCQ: { "type": "mcq", "question": "string", "options": ["string", "string", "string", "string"], "correct": number (0-3) }
        For Coding: { "type": "coding", "question": "string", "language": "javascript" | "python", "placeholder": "starter code string" }
        `,
        config: { responseMimeType: "application/json" }
      });
      res.json({ output: JSON.parse(response.text || '[]') });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/ai/webcam-monitor', authenticateToken, async (req, res) => {
    try {
      const { image, testId } = req.body;
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          { text: "Analyze this webcam frame for test integrity. Check if: 1. There are multiple people. 2. There is no person. 3. The person is looking away from the screen for a suspicious amount of time. Respond in JSON format with 'violation' (boolean) and 'reason' (string or null)." },
          { inlineData: { data: image, mimeType: "image/jpeg" } }
        ],
        config: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/ai/generate-questions', aiLimiter, authenticateToken, ensureAdmin, async (req, res) => {
    try {
      const { title, category, count } = req.body;
      const qwenModel = getQwenModel();
      const { error, output } = await qwenModel.run([
        {
          role: "user",
          content: `You are an expert ${category} teacher. I am creating a test titled "${title}". 
          Generate ${count} high-quality, real-world multiple-choice questions for this specific topic.
          Do not generate overly simplistic questions; ensure they test conceptual understanding.
          
          Return the response STRICTLY as a JSON array of objects, with each object following this exact structure:
          [
            {
              "type": "mcq",
              "question": "The question text here...",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct": 0
            }
          ]`
        }
      ]);
      if (error) return res.status(500).json({ error });

      let jsonStr = (output as any).content || "";
      jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>\s*/g, '');
      if (jsonStr.includes('```json')) jsonStr = jsonStr.match(/```json\n([\s\S]*?)\n```/)?.[1] || jsonStr;
      else if (jsonStr.includes('```')) jsonStr = jsonStr.match(/```\n([\s\S]*?)\n```/)?.[1] || jsonStr;
      else {
        const arrayMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) jsonStr = arrayMatch[0];
      }

      res.json({ output: JSON.parse(jsonStr.trim()) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/ai/analyze-performance', aiLimiter, authenticateToken, async (req, res) => {
    try {
      const { submissionData } = req.body;
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze this test submission and provide personalized feedback:
        Score: ${submissionData.score}/${submissionData.totalQuestions}
        Accuracy: ${submissionData.accuracy}%
        Time taken: ${submissionData.timeTaken} seconds
        Test: ${submissionData.testTitle}
        
        Return JSON with: summary (string, 1-2 sentences), strengths (array of strings), weaknesses (array of strings), nextSteps (array of strings).`,
        config: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 CampusRank Server running on http://localhost:${PORT}`);
    try {
      const open = (await import('open')).default;
      await open(`http://localhost:${PORT}`);
    } catch (e) {
      console.log('Could not open browser naturally.');
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
