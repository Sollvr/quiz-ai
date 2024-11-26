'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ChevronRight, Play, X } from 'lucide-react';

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);

  const closeModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <BrainCircuit className="w-20 h-20 mx-auto text-blue-500" />
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            AI Quiz Generator
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Create engaging quizzes in seconds with AI. Perfect for teachers, students, and anyone who wants to learn in a fun way.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2"
              onClick={() => window.location.href = '/quiz'}
            >
              Start Creating
              <ChevronRight className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2"
              onClick={() => setShowDemo(true)}
            >
              Watch Demo
              <Play className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              title: 'AI-Powered Questions',
              description: 'Generate high-quality questions on any topic using advanced AI technology.'
            },
            {
              title: 'Instant Feedback',
              description: 'Get immediate feedback with sound effects and visual cues for each answer.'
            },
            {
              title: 'Customizable Difficulty',
              description: 'Choose from multiple difficulty levels to match your knowledge and goals.'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-zinc-900 p-6 rounded-xl space-y-4"
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Demo Video Modal */}
      {showDemo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-zinc-900 rounded-xl overflow-hidden max-w-4xl w-full aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              className="w-full h-full"
              controls
              autoPlay
              src="/demo.mp4"
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
