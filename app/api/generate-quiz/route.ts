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

    const prompt = `Generate a quiz about "${topic}" with exactly ${numQuestions} multiple choice questions at ${difficulty} difficulty level. 
    
Return a JSON object with a 'questions' array. The response should follow this exact structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The correct option text that matches exactly one of the options"
    }
  ]
}

The difficulty levels should be interpreted as follows:
- Easy: Basic knowledge and straightforward questions
- Medium: Moderate complexity requiring good understanding
- Hard: Complex questions requiring deep knowledge

Important: The response must be a valid JSON object with a 'questions' array containing exactly ${numQuestions} questions.`;

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a quiz generator that always responds with valid JSON containing a 'questions' array. Format your response exactly as specified in the prompt."
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

      // Parse the response
      const parsedResponse = JSON.parse(response) as QuizResponse;
      
      // Ensure we have a questions array
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        console.error('Invalid response format:', parsedResponse);
        throw new Error('Invalid response format: missing questions array');
      }

      const questions = parsedResponse.questions;

      // Validate the structure of each question
      const validatedQuestions = questions.map((q: QuizQuestion, index: number) => {
        if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
          throw new Error(`Invalid question format at index ${index}`);
        }
        if (q.options.length !== 4) {
          throw new Error(`Question ${index + 1} does not have exactly 4 options`);
        }
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(`Question ${index + 1} correct answer is not in options`);
        }
        return {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        };
      });

      if (validatedQuestions.length !== parseInt(numQuestions)) {
        throw new Error(`Expected ${numQuestions} questions but got ${validatedQuestions.length}`);
      }

      return NextResponse.json({ questions: validatedQuestions });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to generate valid quiz questions. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
} 