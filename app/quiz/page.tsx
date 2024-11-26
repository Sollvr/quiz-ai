'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

export default function QuizPage() {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'input' | 'quiz' | 'result'>('input');
  const [numQuestions, setNumQuestions] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctSound] = useState(() => typeof Audio !== 'undefined' ? new Audio('/correct.mp3') : null);
  const [wrongSound] = useState(() => typeof Audio !== 'undefined' ? new Audio('/wrong.mp3') : null);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic,
          numQuestions: parseInt(numQuestions),
          difficulty 
        }),
      });
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        setError('Failed to generate quiz questions. Please try again.');
        return;
      }

      setQuestions(data.questions);
      setGameState('quiz');
    } catch (error) {
      setError('Failed to generate quiz. Please try again.');
      console.error('Error generating quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    const correct = answer === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      correctSound?.play();
    } else {
      wrongSound?.play();
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (correct) {
      setScore(score + 1);
    }
    
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setGameState('result');
    }
  };

  const resetQuiz = () => {
    setTopic('');
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setGameState('input');
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const getAnswerButtonClass = (option: string) => {
    if (selectedAnswer === null) {
      return "w-full text-left p-4 rounded-lg border border-zinc-700 text-white hover:bg-zinc-800 transition-colors";
    }
    if (selectedAnswer === option) {
      return `w-full text-left p-4 rounded-lg border text-white ${
        option === questions[currentQuestion].correctAnswer
          ? "bg-green-600 border-green-500"
          : "bg-red-600 border-red-500"
      }`;
    }
    if (option === questions[currentQuestion].correctAnswer && selectedAnswer !== null) {
      return "w-full text-left p-4 rounded-lg border text-white bg-green-600 border-green-500";
    }
    return "w-full text-left p-4 rounded-lg border border-zinc-700 text-white";
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <header className="text-center space-y-2">
          <BrainCircuit className="w-16 h-16 mx-auto text-blue-500" />
          <h1 className="text-4xl font-bold tracking-tight">AI Quiz Generator</h1>
          <p className="text-zinc-400">Create engaging quizzes in seconds with AI</p>
        </header>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        {gameState === 'input' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-xl p-6 space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Quiz Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
                placeholder="Enter the quiz topic..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Difficulty Level</label>
              <div className="flex space-x-4">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-2 rounded-lg ${
                      difficulty === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Number of Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
                <option value="20">20 Questions</option>
              </select>
            </div>

            <button
              onClick={generateQuiz}
              disabled={loading || !topic}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  Generate Quiz
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {gameState === 'quiz' && questions && questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-xl p-6 space-y-6"
          >
            <div className="flex justify-between items-center text-sm text-zinc-400">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <h2 className="text-xl font-semibold text-white">
              {questions[currentQuestion].question}
            </h2>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option: string, index: number) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: selectedAnswer === null ? 1.02 : 1 }}
                  whileTap={{ scale: selectedAnswer === null ? 0.98 : 1 }}
                  onClick={() => selectedAnswer === null && handleAnswer(option)}
                  className={getAnswerButtonClass(option)}
                  disabled={selectedAnswer !== null}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'result' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-xl p-6 space-y-6 text-center"
          >
            <h2 className="text-2xl font-semibold text-white">Quiz Complete!</h2>
            <div className="text-6xl font-bold text-blue-500">
              {Math.round((score / questions.length) * 100)}%
            </div>
            <p className="text-zinc-400">
              You got {score} out of {questions.length} questions correct
            </p>
            <button
              onClick={resetQuiz}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center"
            >
              Try Another Quiz
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
} 