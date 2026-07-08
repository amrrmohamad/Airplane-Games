import React, { useState } from 'react';
import { Heart, ArrowLeft, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight } from 'lucide-react';
import { MazeCanvas } from './MazeCanvas';
import type { Question } from '../data/questions';

interface GameScreenProps {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  lives: number;
  onCorrectAnswer: () => void;
  onWrongAnswer: (word: string) => void;
  onLoseLife: () => void;
  onBackToWelcome: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  questions,
  currentQuestionIndex,
  score,
  lives,
  onCorrectAnswer,
  onWrongAnswer,
  onLoseLife,
  onBackToWelcome,
}) => {
  const currentQuestion = questions[currentQuestionIndex];
  
  // Distribute correct word + 3 distractors randomly
  // To keep it persistent for this question, we memoize it or generate it once.
  // We can use a simple seeded shuffle based on currentQuestionIndex, or state.
  // Using state is simple: when currentQuestionIndex changes, we generate a shuffled array of words.
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [lastIndex, setLastIndex] = useState<number>(-1);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Touch pad external direction input
  const [extDir, setExtDir] = useState<string | null>(null);

  if (lastIndex !== currentQuestionIndex && currentQuestion) {
    const allWords = [currentQuestion.word, ...currentQuestion.distractors];
    // Simple random shuffle
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }
    setShuffledWords(allWords);
    setLastIndex(currentQuestionIndex);
  }

  const triggerNotification = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  const handleWrong = (word: string) => {
    onWrongAnswer(word);
    triggerNotification(`❌ كلمة "${word}" خاطئة! (-20 نقطة)`, 'error');
  };

  const handleCorrect = () => {
    triggerNotification('⭐ إجابة صحيحة! أحسنت! (+100 نقطة)', 'success');
    onCorrectAnswer();
  };

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      hearts.push(
        <Heart
          key={i}
          className={`w-6 h-6 transition-all duration-300 ${
            i < lives
              ? 'text-[#ff007f] fill-[#ff007f] filter drop-shadow-[0_0_5px_rgba(255,0,127,0.7)]'
              : 'text-gray-600 fill-transparent'
          }`}
        />
      );
    }
    return <div className="flex gap-1">{hearts}</div>;
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-6xl mx-auto p-4 md:p-6 min-h-screen">
      
      {/* 1. Header panel */}
      <div className="glass-panel w-full flex items-center justify-between px-6 py-4 mb-4 relative z-10">
        <button
          onClick={onBackToWelcome}
          className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4 ml-1" />
          الرئيسية
        </button>

        {/* HUD Info */}
        <div className="flex items-center gap-6">
          {/* Level */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">المرحلة</span>
            <span className="text-xl font-black text-[#00f0ff]">{currentQuestionIndex + 1} / {questions.length}</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">النقاط</span>
            <span className="text-xl font-black text-[#39ff14]">{score}</span>
          </div>

          {/* Lives */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">المحاولات</span>
            {renderHearts()}
          </div>
        </div>
      </div>

      {/* 2. Main layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-center justify-center">
        
        {/* Left Side: Question Display */}
        <div className="glass-panel w-full lg:w-[350px] p-6 text-center flex flex-col items-center justify-center min-h-[300px] lg:min-h-[500px]">
          {/* Question Image */}
          {currentQuestion && (
            <div className="relative group overflow-hidden rounded-2xl border-2 border-[#00f0ff] bg-slate-900 pulse-glow-cyan w-40 h-40 flex items-center justify-center">
              <img
                src={currentQuestion.image}
                alt="سؤال المتاهة"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          )}
        </div>

        {/* Center: Maze Board */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Toast Notification overlay */}
          {notification && (
            <div
              className={`absolute top-4 px-6 py-3 rounded-full font-black text-white shadow-lg transition-all duration-300 z-20 ${
                notification.type === 'success'
                  ? 'bg-emerald-600/90 border border-emerald-400 neon-border-cyan'
                  : 'bg-rose-600/90 border border-rose-400 animate-shake neon-border-pink'
              }`}
            >
              {notification.text}
            </div>
          )}

          <MazeCanvas
            words={shuffledWords}
            correctWord={currentQuestion?.word}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onLoseLife={onLoseLife}
            lives={lives}
            isPaused={false}
            externalDirection={extDir}
          />
        </div>

      </div>

      {/* 3. On-screen controls (Mobile D-pad) */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <span className="text-xs text-gray-500 font-bold md:hidden">أزرار التحكم للشاشات التي تعمل باللمس</span>
        <div className="flex flex-col items-center gap-1 bg-slate-900/60 p-3 rounded-3xl border border-gray-800 shadow-xl max-w-xs">
          {/* Row 1: Up */}
          <button
            onTouchStart={() => setExtDir('up')}
            onMouseDown={() => setExtDir('up')}
            onTouchEnd={() => setExtDir(null)}
            onMouseUp={() => setExtDir(null)}
            onMouseLeave={() => setExtDir(null)}
            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl flex items-center justify-center active:scale-90 active:bg-slate-600 transition-all"
          >
            <ArrowUp className="w-6 h-6 text-[#00f0ff]" />
          </button>
          
          {/* Row 2: Left, Down, Right */}
          <div className="flex gap-4">
            <button
              onTouchStart={() => setExtDir('left')}
              onMouseDown={() => setExtDir('left')}
              onTouchEnd={() => setExtDir(null)}
              onMouseUp={() => setExtDir(null)}
              onMouseLeave={() => setExtDir(null)}
              className="w-12 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl flex items-center justify-center active:scale-90 active:bg-slate-600 transition-all"
            >
              <ArrowLeftIcon className="w-6 h-6 text-[#00f0ff]" />
            </button>
            <button
              onTouchStart={() => setExtDir('down')}
              onMouseDown={() => setExtDir('down')}
              onTouchEnd={() => setExtDir(null)}
              onMouseUp={() => setExtDir(null)}
              onMouseLeave={() => setExtDir(null)}
              className="w-12 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl flex items-center justify-center active:scale-90 active:bg-slate-600 transition-all"
            >
              <ArrowDown className="w-6 h-6 text-[#00f0ff]" />
            </button>
            <button
              onTouchStart={() => setExtDir('right')}
              onMouseDown={() => setExtDir('right')}
              onTouchEnd={() => setExtDir(null)}
              onMouseUp={() => setExtDir(null)}
              onMouseLeave={() => setExtDir(null)}
              className="w-12 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl flex items-center justify-center active:scale-90 active:bg-slate-600 transition-all"
            >
              <ArrowRight className="w-6 h-6 text-[#00f0ff]" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
