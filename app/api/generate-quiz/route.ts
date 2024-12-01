import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizResponse {
  questions: QuizQuestion[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Reduced questions for faster response
const MAX_QUESTIONS = 10;
const TIMEOUT_MS = 8000; // 8 seconds timeout

export const runtime = 'edge'; // Use edge runtime for better performance

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { topic, numQuestions, difficulty } = await req.json();

    if (!topic || !numQuestions || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Limit maximum questions
    const requestedQuestions = Math.min(parseInt(numQuestions), MAX_QUESTIONS);
    
    // Generate all questions in one request to avoid timeout issues
    const prompt = `Generate ${requestedQuestions} multiple choice questions about "${topic}" at ${difficulty} difficulty level.

Each question must follow this format:
{
  "question": "Clear, concise question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "The exact text of the correct option"
}

Requirements:
- Questions should be appropriate for ${difficulty} difficulty
- Each question must have exactly 4 options
- The correctAnswer must exactly match one of the options
- No duplicate questions or options
- Keep questions and answers concise

Return a JSON object with this structure:
{
  "questions": [
    // Array of question objects as specified above
  ]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a quiz generator that creates clear, accurate questions. Always respond with valid JSON containing a questions array."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-3.5-turbo-1106",
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      clearTimeout(timeoutId);

      const response = completion.choices[0].message.content;
      
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      const parsedResponse = JSON.parse(response) as QuizResponse;
      
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid response format: missing questions array');
      }

      // Validate questions
      parsedResponse.questions.forEach((q, index) => {
        if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
          throw new Error(`Invalid question format at index ${index}`);
        }
        if (q.options.length !== 4) {
          throw new Error(`Question ${index + 1} does not have exactly 4 options`);
        }
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(`Question ${index + 1} correct answer is not in options`);
        }
      });

      return NextResponse.json({ 
        questions: parsedResponse.questions.slice(0, requestedQuestions)
      });

    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out. Please try with fewer questions.' },
          { status: 408 }
        );
      }
      throw error;
    }

  } catch (error: unknown) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to generate quiz. Please try again.'
      },
      { status: 500 }
    );
  }
} 