import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Home, RotateCcw } from 'lucide-react';
import { audio } from '../utils/audio';

interface ResultModalProps {
  lanaScore: number;
  mariaScore: number;
  onRestart: () => void;
  onExit: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  lanaScore,
  mariaScore,
  onRestart,
  onExit
}) => {
  const isLanaWinner = lanaScore > mariaScore;
  const isTie = lanaScore === mariaScore;

  useEffect(() => {
    if (isLanaWinner) {
      // Fire confetti celebration!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      // Play win sound
      audio.playWinFanfare();
    } else {
      // Play lose or tie sound
      audio.playFailure();
    }
  }, [isLanaWinner]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div 
        className="card-result rounded-[32px] shadow-2xl p-5 md:p-6 max-w-md w-full text-center relative animate-float-in"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        
        {/* Decorative Stars / Trophy */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-brand text-white w-18 h-18 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
          <Trophy className="w-8 h-8 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-amber-dark mb-4 drop-shadow-sm" style={{ marginTop: '56px' }}>
          {isLanaWinner 
            ? 'فوز مذهل يا بطل!' 
            : isTie 
              ? 'تعادل رائع ولعب مميز!' 
              : 'حكيم فاز هذه المرة! حاول مجدداً.'}
        </h2>

        {/* Scores Comparison */}
        <div className="grid grid-cols-2 gap-4 my-4 bg-amber-950/10 p-3 rounded-xl border border-amber-950/20">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-amber-dark">نقاط لانا (أنت)</span>
            <span className="text-3xl font-black text-amber-score mt-1">{lanaScore}</span>
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1.5">
              {isLanaWinner ? 'الفائز' : isTie ? 'تعادل' : ''}
            </span>
          </div>

          <div className="flex flex-col items-center border-r border-amber-950/10">
            <span className="text-xs font-bold text-amber-dark">نقاط حكيم (الخصم)</span>
            <span className="text-3xl font-black text-slate-700 mt-1">{mariaScore}</span>
            <span className="text-[9px] font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full mt-1.5">
              {!isLanaWinner && !isTie ? 'الفائز' : isTie ? 'تعادل' : ''}
            </span>
          </div>
        </div>

        <p className="text-amber-mid font-bold text-xs leading-relaxed mb-4 px-4">
          {isLanaWinner 
            ? 'لقد كنت سريعاً جداً وأصبت الإجابات بدقة عالية! فخورون بك!' 
            : 'لا بأس، التدريب المستمر يجعلك بطلاً لا يقهر. العب مرة أخرى وتغلب على حكيم!'}
        </p>

        {/* Control Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              audio.playClick();
              onRestart();
            }}
            className="w-full py-3 btn-restart text-white font-black text-lg rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[3]" />
            <span>العب مجدداً</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onExit();
            }}
            className="w-full py-2.5 btn-menu text-white font-bold text-md rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>الخروج للقائمة الرئيسية</span>
          </button>
        </div>
        
        <div style={{ height: '4px' }}></div>

      </div>
    </div>
  );
};
