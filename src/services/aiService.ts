import { auth } from '@/src/lib/firebase';

const getAuthToken = async () => {
  if (!auth.currentUser) return '';
  return await auth.currentUser.getIdToken();
}

export async function chatWithQwen(message: string) {
  try {
    const token = await getAuthToken();
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ message })
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result.output;
  } catch (error) {
    console.error("Bytez Qwen Error:", error);
    return null;
  }
}

export async function getTestRecommendations(studentPerformance: any) {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ studentPerformance })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return {
      recommendations: ["Data Structures", "Algorithms", "System Design"],
      reasoning: "Focus on core computer science fundamentals."
    };
  }
}

export async function scoreResume(resumeText: string) {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/ai/score-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ resumeText })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
    console.error("AI Resume Scoring Error:", error);
    return {
      score: 75,
      feedback: ["Add more quantifiable achievements.", "Include links to projects."],
      missingKeywords: ["Docker", "Kubernetes", "CI/CD"]
    };
  }
}

export async function getAIHint(question: string, questionType: string) {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/ai/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ question, questionType })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result.output || "Think about the core concept behind this problem.";
  } catch (error) {
    console.error("AI Hint Error:", error);
    return "Think step by step about the fundamentals this question tests.";
  }
}

export async function getAIPerformanceAnalysis(submissionData: any) {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/ai/analyze-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ submissionData })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      summary: "Good effort! Review your weak areas and keep practicing.",
      strengths: ["Completed the test within time"],
      weaknesses: ["Some concepts need more practice"],
      nextSteps: ["Review incorrect answers", "Practice similar problems"]
    };
  }
}

export async function autoGenerateTestQuestions(title: string, category: string, count: number = 5) {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/ai/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, category, count })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result.output || [];
  } catch (error) {
    console.error("AI Test Generation Error:", error);
    return [];
  }
}
/**
 * ML Model Dataset Processor
 * Ingests a raw dataset (CSV, JSON, or Text) of questions and intelligently
 * extracts, categorizes, and formats them into the application's native structure
 * using Google's generative models.
 */
export async function modelProcessDataset(datasetRawText: string, categoryContext: string) {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/ai/process-dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ datasetRawText, categoryContext })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result.output || [];
  } catch (error) {
    console.error("ML Dataset Processing Error:", error);
    return [];
  }
}
