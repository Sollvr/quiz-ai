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

const MAX_RETRIES = 2;
const BATCH_SIZE = 5;

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

    // For larger number of questions, generate them in batches
    const totalQuestions = parseInt(numQuestions);
    const batches = Math.ceil(totalQuestions / BATCH_SIZE);
    let allQuestions: QuizQuestion[] = [];

    for (let batch = 0; batch < batches; batch++) {
      const questionsInBatch = Math.min(BATCH_SIZE, totalQuestions - batch * BATCH_SIZE);
      const batchQuestions = await generateQuizBatch(topic, questionsInBatch, difficulty, batch + 1);
      allQuestions = [...allQuestions, ...batchQuestions];
    }

    return NextResponse.json({ questions: allQuestions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}

async function generateQuizBatch(
  topic: string,
  numQuestions: number,
  difficulty: string,
  batchNumber: number,
): Promise<QuizQuestion[]> {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const prompt = `Generate ${numQuestions} multiple choice questions about "${topic}" at ${difficulty} difficulty level.
      
Each question must be unique and follow this exact format:
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
- No markdown formatting or additional text

Return a JSON object with this structure:
{
  "questions": [
    // Array of question objects as specified above
  ]
}`;

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
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

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

      return parsedResponse.questions;
    } catch (error) {
      console.error(`Batch ${batchNumber} attempt ${retries + 1} failed:`, error);
      retries++;
      
      if (retries > MAX_RETRIES) {
        throw new Error(`Failed to generate questions batch ${batchNumber} after ${MAX_RETRIES} attempts`);
      }
    }
  }

  throw new Error('Failed to generate questions after all retries');
} 