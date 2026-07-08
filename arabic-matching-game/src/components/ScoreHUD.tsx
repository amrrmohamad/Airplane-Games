import React from 'react';
import { LogOut } from 'lucide-react';

const StarIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }} fill="#fbbf24" stroke="#d97706" strokeWidth="1.5">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

interface ScoreHUDProps {
  lanaScore: number;
  mariaScore: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  timerText: string;
  timeLeftPercent: number; // 0 to 100
  onExit: () => void;
  streakCount: number;
}

export const ScoreHUD: React.FC<ScoreHUDProps> = ({
  lanaScore,
  mariaScore,
  currentQuestionIndex,
  totalQuestions,
  timerText,
  timeLeftPercent,
  onExit,
  streakCount
}) => {
  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Top HUD Row */}
      <div className="w-full max-w-5xl flex items-center justify-between px-4 py-3 z-20" style={{ direction: 'ltr' }}>
        
        {/* Timer (Top Left) */}
        <div className="relative w-16 h-16 flex items-center justify-center bg-slate-900/80 rounded-full border-2 border-white/20 shadow-lg">
          {/* Radial progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="transparent"
              stroke={timeLeftPercent < 20 ? "#ef4444" : "#4ade80"}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - timeLeftPercent / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="relative text-sm font-black text-white tracking-wider">{timerText}</span>
        </div>

        {/* Progress Banner (Top Center) */}
        <div className="relative flex items-center justify-center px-8 py-2 md:px-12 banner-progress rounded-2xl shadow-lg transform -skew-x-6">
          <span className="text-xl md:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {currentQuestionIndex + 1}/{totalQuestions}
          </span>
        </div>

        {/* Exit Button (Top Right) */}
        <button
          onClick={onExit}
          className="w-12 h-12 flex items-center justify-center btn-exit text-white rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg cursor-pointer"
        >
          <LogOut className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Players Row & Progress Ladder */}
      <div className="w-full max-w-5xl flex justify-between items-start px-4 mt-2 z-10" style={{ direction: 'ltr' }}>
        
        {/* Lana Player HUD (Left) */}
        <div className="flex items-center gap-3 relative">
          
          {/* Vertical Progress Ladder */}
          <div className="flex flex-col items-center">
            <div 
              className="relative progress-ladder-tube rounded-full overflow-hidden flex flex-col justify-end p-0.5 shadow-inner"
              style={{ width: '20px', height: '128px' }}
            >
              {/* Inner active fill */}
              <div 
                className="w-full progress-ladder-fill rounded-full transition-all duration-500 shadow-[0_0_10px_#4ade80]"
                style={{ height: `${(lanaScore / (totalQuestions * 10)) * 100}%` }}
              />
              {/* Flower notches */}
              {[...Array(5)].map((_, idx) => (
                <div 
                  key={idx}
                  className="absolute left-1/2 -translate-x-1/2 w-4 h-4 flex items-center justify-center"
                  style={{ bottom: `${(idx + 1) * 16}%` }}
                >
                  <span 
                    className={`transition-opacity duration-300 ${lanaScore >= (idx + 1) * 20 ? 'opacity-100 animate-pulse' : 'opacity-30'}`}
                    style={{ fontSize: '10px' }}
                  >
                    🌸
                  </span>
                </div>
              ))}
            </div>
            <span 
              className="font-bold text-slate-700 mt-1"
              style={{ fontSize: '10px' }}
            >
              التقدم
            </span>
          </div>

          <div className="flex flex-col items-center">
            {/* Avatar Circle */}
            <div className="relative w-16 h-16 avatar-lana rounded-full shadow-lg flex items-center justify-center">
              {/* Cute Cat SVG Face */}
              <svg viewBox="0 0 100 100" style={{ width: '48px', height: '48px' }}>
                <path d="M25 45 L15 15 L35 30 Z" fill="#f97316" />
                <path d="M75 45 L85 15 L65 30 Z" fill="#f97316" />
                <circle cx="50" cy="55" r="30" fill="#f97316" />
                <circle cx="50" cy="58" r="22" fill="#ffedd5" />
                <ellipse cx="40" cy="48" rx="3.5" ry="5" fill="#222" />
                <ellipse cx="60" cy="48" rx="3.5" ry="5" fill="#222" />
                <polygon points="50,55 45,51 55,51" fill="#f43f5e" />
                <path d="M45 60 Q50 63 50 58 Q50 63 55 60" stroke="#f97316" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>

              {/* Star Score Badge (Outside, Top-Right) - Highly Visible Golden style */}
              <div 
                className="absolute flex items-center gap-1 rounded-full px-2 py-0.5 shadow-lg animate-bounce z-10"
                style={{ 
                  position: 'absolute',
                  top: '-12px',
                  right: '-40px',
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fcd34d 100%)', 
                  border: '2px solid #b45309',
                  whiteSpace: 'nowrap'
                }}
              >
                <StarIcon />
                <span className="text-xs font-black text-amber-950 drop-shadow-sm">{lanaScore}</span>
              </div>
            </div>

            {/* Nameplate */}
            <div className="mt-2 px-4 py-0.5 bg-orange-brand border-2 border-white rounded-full shadow-md">
              <span className="text-xs font-black text-white uppercase tracking-wider">LANA</span>
            </div>
            {/* Streak Counter */}
            {streakCount > 1 && (
              <div className="mt-1 px-2.5 py-0.5 bg-amber-400 border border-amber-500 rounded-full text-xs font-black text-amber-950 animate-pulse" style={{ fontSize: '9px' }}>
                🔥 تتابع {streakCount}!
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Avatar Circle */}
          <div className="relative w-16 h-16 avatar-maria rounded-full shadow-lg flex items-center justify-center">
            <img 
              src="/assets/cute_robot.png" 
              alt="حكيم" 
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
            />

            {/* Star Score Badge (Outside, Top-Left) - Highly Visible Golden style */}
            <div 
              className="absolute flex items-center gap-1 rounded-full px-2 py-0.5 shadow-lg z-10"
              style={{ 
                position: 'absolute',
                top: '-12px',
                left: '-40px',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fcd34d 100%)', 
                border: '2px solid #b45309',
                whiteSpace: 'nowrap'
              }}
            >
              <span className="text-xs font-black text-amber-950 drop-shadow-sm">{mariaScore}</span>
              <StarIcon />
            </div>
          </div>

          {/* Nameplate */}
          <div className="mt-2 px-4 py-0.5 bg-sky-brand border-2 border-white rounded-full shadow-md">
            <span className="text-xs font-black text-white uppercase tracking-wider">حكيم</span>
          </div>
          <div className="mt-1 px-2 py-0.5 bg-sky-200 border border-sky-300 rounded-full font-bold text-sky-800" style={{ fontSize: '9px' }}>
            الذكاء الاصطناعي (AI) 🤖
          </div>
        </div>

      </div>
    </div>
  );
};
