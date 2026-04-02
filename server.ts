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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to initialize Firebase Admin — graceful fallback if creds missing
let adminDb: any = null;
let adminAuth: any = null;

try {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');

  const configPath = './firebase-applet-config.json';
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    if (firebaseConfig.projectId) {
      const adminApp = initializeApp({
        projectId: firebaseConfig.projectId
      });
      adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
      adminAuth = getAuth(adminApp);
      console.log('✅ Firebase Admin initialized for project:', firebaseConfig.projectId);
    } else {
      console.warn('⚠️  Firebase config missing projectId — admin APIs disabled');
    }
  } else {
    console.warn('⚠️  firebase-applet-config.json not found — admin APIs disabled');
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
    origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : '*', // Configure for prod
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.json({ limit: '1mb' })); // Prevent large payload attacks

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
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
      // For local dev without admin SDK, we might bypass or reject. Secure default: reject
      return res.status(503).json({ error: 'Auth service unavailable' });
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
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

  // Execute Code safely using Docker via STDIN (No File Mounting Needed!)
  app.post('/api/execute-code', executeCodeLimiter, authenticateToken, async (req, res) => {
    const { language, code } = req.body;
    
    if (!language || typeof language !== 'string' || !code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Language and code are required strings' });
    }

    // Limit code execution size to prevent DoS via massive input
    if (code.length > 50000) {
      return res.status(400).json({ error: 'Code size limit exceeded (max 50,000 characters)' });
    }

    const { exec } = await import('child_process');
    
    let containerImage = '';
    let runCommand = '';

    if (language === 'python' || language === 'python3') {
      containerImage = 'python:3.9-slim';
      runCommand = `docker run -i --rm --network none --memory 128m --cpus 0.5 ${containerImage} python -`;
    } else if (language === 'javascript' || language === 'nodejs') {
      containerImage = 'node:18-alpine';
      runCommand = `docker run -i --rm --network none --memory 128m --cpus 0.5 ${containerImage} node -`;
    } else if (language === 'cpp' || language === 'c++') {
      containerImage = 'gcc:latest';
      runCommand = `docker run -i --rm --network none --memory 128m --cpus 0.5 ${containerImage} sh -c "cat > main.cpp && g++ -O2 main.cpp && ./a.out"`;
    } else if (language === 'java') {
      containerImage = 'openjdk:17-slim';
      runCommand = `docker run -i --rm --network none --memory 128m --cpus 0.5 ${containerImage} sh -c "cat > Main.java && javac Main.java && java Main"`;
    } else if (language === 'go') {
      containerImage = 'golang:1.20-alpine';
      runCommand = `docker run -i --rm --network none --memory 128m --cpus 0.5 ${containerImage} sh -c "cat > main.go && go run main.go"`;
    } else if (language === 'rust') {
      containerImage = 'rust:slim';
      runCommand = `docker run -i --rm --network none --memory 128m --cpus 0.5 ${containerImage} sh -c "cat > main.rs && rustc main.rs && ./main"`;
    } else {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    // Spawn a child process to stream the code into the docker container's stdin
    const child = exec(runCommand, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error && error.killed) {
         return res.json({ output: '', error: 'Execution Timed Out (Exceeded 30 seconds)' });
      }
      res.json({
        output: stdout,
        error: stderr || (error ? error.message : null)
      });
    });

    if (child.stdin) {
      child.stdin.write(code);
      child.stdin.end();
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
