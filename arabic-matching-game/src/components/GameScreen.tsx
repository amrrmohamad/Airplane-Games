import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { ScoreHUD } from './ScoreHUD';
import { ItemIllustration } from './ItemIllustrations';
import { ResultModal } from './ResultModal';
import type { Question } from '../data/questions';
import { audio } from '../utils/audio';
import { GameAPI, ARABIC_MATCHING_GAME_ID } from '../utils/gameApi';

interface GameScreenProps {
  onBackToWelcome: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onBackToWelcome }) => {
  // Game states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lanaScore, setLanaScore] = useState(0);
  const [mariaScore, setMariaScore] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // API
  const [gameAPI, setGameAPI] = useState<GameAPI | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [urlGameId, setUrlGameId] = useState<number | null>(null);
  const [urlLessonId, setUrlLessonId] = useState<number | null>(null);
  
  // Timer state: 170 seconds = 2 minutes and 50 seconds
  const [timeLeft, setTimeLeft] = useState(170);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Card states
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [checkedAnswer, setCheckedAnswer] = useState<string | null>(null);
  const [mariaChoice, setMariaChoice] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  
  // References
  const mariaTimerRef = useRef<any | null>(null);
  const advanceTimerRef = useRef<any | null>(null);
  const timerIntervalRef = useRef<any | null>(null);
  const selectedAnswerRef = useRef<string | null>(null);
  const mariaChoiceRef = useRef<string | null>(null);
  const checkedAnswerRef = useRef<string | null>(null);
  const isGameOverRef = useRef<boolean>(false);

  // Sync refs on state changes to prevent stale closure bugs in timers
  useEffect(() => {
    selectedAnswerRef.current = selectedAnswer;
  }, [selectedAnswer]);

  useEffect(() => {
    mariaChoiceRef.current = mariaChoice;
  }, [mariaChoice]);

  useEffect(() => {
    checkedAnswerRef.current = checkedAnswer;
  }, [checkedAnswer]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);
  
  const currentQuestion = questions[currentIdx];

  
  // Initialize API and read URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdParam = urlParams.get('gameId');
    const lessonIdParam = urlParams.get('lessonId');
    const tokenParam = urlParams.get('token');
    
    if (gameIdParam) setUrlGameId(parseInt(gameIdParam));
    if (lessonIdParam) setUrlLessonId(parseInt(lessonIdParam));
    
    let token = tokenParam || localStorage.getItem('childToken') || sessionStorage.getItem('childToken');
    
    if (tokenParam) {
      localStorage.setItem('childToken', tokenParam);
      token = tokenParam;
    }
    
    if (token) {
      setGameAPI(new GameAPI(token));
    } else {
      setError('يجب تسجيل الدخول أولاً للعب اللعبة');
      setLoading(false);
    }
  }, []);

  // Initialize Game
  const initGame = async () => {
    if (!gameAPI) return;
    
    setLoading(true);
    setError(null);
    
    // Clear any existing timers
    if (mariaTimerRef.current) clearTimeout(mariaTimerRef.current);
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    try {
      const gameIdToUse = urlGameId || ARABIC_MATCHING_GAME_ID;
      const data = await gameAPI.getQuestions(gameIdToUse, urlLessonId || undefined);
      
      // Transform backend questions to game format
      const transformedQuestions: Question[] = data.questions.map((q: any) => {
        const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        
        // Convert options to choice objects with text and optional imageUrl
        const choices = options.map((opt: any) => {
          if (typeof opt === 'string') {
            return { text: opt, imageUrl: null };
          } else {
            return { text: opt.text || opt, imageUrl: opt.imageUrl || null };
          }
        });
        
        // Shuffle choices randomly
        const shuffledChoices = [...choices];
        for (let i = shuffledChoices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledChoices[i], shuffledChoices[j]] = [shuffledChoices[j], shuffledChoices[i]];
        }
        
        return {
          id: q.id.toString(),
          word: q.question,
          choices: shuffledChoices,
          correctChoice: typeof q.correctAnswer === 'string' ? q.correctAnswer : options[0],
          imageUrl: q.imageUrl || null
        };
      });
      
      if (transformedQuestions.length === 0) {
        setError('لا توجد أسئلة متاحة لهذا الدرس');
        setLoading(false);
        return;
      }
      
      setQuestions(transformedQuestions);
      
      // Start session with lessonId
      const session = await gameAPI.startSession(gameIdToUse, urlLessonId || undefined);
      setSessionId(session.id);
      
      setCurrentIdx(0);
      setLanaScore(0);
      setMariaScore(0);
      setStreakCount(0);
      setTimeLeft(170);
      setIsGameOver(false);
      setSelectedAnswer(null);
      setCheckedAnswer(null);
      setMariaChoice(null);
      setFeedbackMsg('');
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load questions:', err);
      setError('فشل تحميل الأسئلة من الخادم');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameAPI) {
      initGame();
    }
    return () => {
      if (mariaTimerRef.current) clearTimeout(mariaTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameAPI]);

  // Main countdown timer effect
  useEffect(() => {
    if (isGameOver || questions.length === 0) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isGameOver, questions]);

  // Handle Loading a new question (Trigger speech & Maria's AI thoughts)
  useEffect(() => {
    if (questions.length === 0 || isGameOver || currentIdx >= questions.length) return;

    const question = questions[currentIdx];
    setSelectedAnswer(null);
    setCheckedAnswer(null);
    setMariaChoice(null);
    setFeedbackMsg('');

    // Say the Arabic word aloud
    setTimeout(() => {
      audio.speakArabic(question.word);
    }, 500);

    // Schedule Hakeem (AI Opponent) to answer
    // Hakeem will think for 2.0 to 4.5 seconds
    const thinkTime = 2000 + Math.random() * 2500;
    mariaTimerRef.current = setTimeout(() => {
      triggerMariaAnswer(question);
    }, thinkTime);

    return () => {
      if (mariaTimerRef.current) clearTimeout(mariaTimerRef.current);
    };
  }, [currentIdx, questions, isGameOver]);

  // Simulating Hakeem's (AI) Answer
  const triggerMariaAnswer = (question: Question) => {
    const isQuestionResolved = checkedAnswerRef.current !== null;
    if (isQuestionResolved || mariaChoiceRef.current !== null || isGameOverRef.current) return;

    // Hakeem should guess from choices not yet guessed (especially avoid player's wrong guess)
    const availableChoices = question.choices.filter(c => c.text !== selectedAnswerRef.current);
    const hasCorrectChoice = availableChoices.some(c => c.text === question.correctChoice);
    let chosenText = '';

    if (hasCorrectChoice && Math.random() < 0.8) {
      chosenText = question.correctChoice;
    } else {
      const incorrectChoices = availableChoices.filter(c => c.text !== question.correctChoice);
      chosenText = incorrectChoices[Math.floor(Math.random() * incorrectChoices.length)]?.text || availableChoices[0]?.text || question.choices[0].text;
    }

    setMariaChoice(chosenText);

    if (chosenText === question.correctChoice) {
      setCheckedAnswer(question.correctChoice);
      setMariaScore((prev) => prev + 10);
      setFeedbackMsg('🤖 حكيم أجاب بشكل صحيح وأسرع منك!');
      audio.playFailure();

      advanceTimerRef.current = setTimeout(() => {
        goToNextQuestion();
      }, 2000);
    } else {
      // Hakeem made a wrong choice
      if (selectedAnswerRef.current !== null) {
        // Both guessed wrong! Reveal correct answer and advance
        setCheckedAnswer(question.correctChoice);
        setFeedbackMsg('💥 كِلاكما أخطأ في الإجابة! الإجابة الصحيحة هي: ' + question.word);
        audio.playFailure();
        advanceTimerRef.current = setTimeout(() => {
          goToNextQuestion();
        }, 2500);
      } else {
        // Player hasn't guessed yet, give player a chance
        setFeedbackMsg('🤖 حكيم اختار إجابة خاطئة! أسرع واجِب أنت!');
        audio.playClick();
      }
    }
  };

  // Player clicks an option
  const handlePlayerAnswer = (choiceText: string) => {
    const isQuestionResolved = checkedAnswer !== null;
    if (isQuestionResolved || selectedAnswerRef.current !== null || isGameOver) return;

    setSelectedAnswer(choiceText);
    const isCorrect = choiceText === currentQuestion.correctChoice;

    if (isCorrect) {
      if (mariaTimerRef.current) clearTimeout(mariaTimerRef.current);
      setCheckedAnswer(currentQuestion.correctChoice);
      setLanaScore((prev) => prev + 10);
      setStreakCount((prev) => prev + 1);
      setFeedbackMsg('🎉 رائع! إجابتك صحيحة وسريعة! 🌟');
      audio.playSuccess();

      advanceTimerRef.current = setTimeout(() => {
        goToNextQuestion();
      }, 2000);
    } else {
      // Player guessed wrong
      setStreakCount(0);
      audio.playFailure();

      if (mariaChoiceRef.current !== null) {
        // Both guessed wrong! Reveal correct and advance
        setCheckedAnswer(currentQuestion.correctChoice);
        setFeedbackMsg('💥 كِلاكما أخطأ في الإجابة! الإجابة الصحيحة هي: ' + currentQuestion.word);
        advanceTimerRef.current = setTimeout(() => {
          goToNextQuestion();
        }, 2500);
      } else {
        // Hakeem hasn't guessed yet, trigger Hakeem to think and answer now
        setFeedbackMsg('💥 أوه! إجابة خاطئة. حكيم 🤖 يحاول الإجابة الآن!');
        if (mariaTimerRef.current) clearTimeout(mariaTimerRef.current);
        mariaTimerRef.current = setTimeout(() => {
          triggerMariaAnswer(currentQuestion);
        }, 1500);
      }
    }
  };

  const goToNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Game completed - submit to backend
      if (gameAPI && sessionId) {
        gameAPI.completeSession(sessionId).catch(err => {
          console.error('Failed to complete session:', err);
        });
      }
      setIsGameOver(true);
    }
  };

  const speakCurrentWord = () => {
    if (currentQuestion) {
      audio.speakArabic(currentQuestion.word);
    }
  };

  // Formatter for timer minutes and seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const timeLeftPercent = (timeLeft / 170) * 100;

  return (
    <div className="game-screen w-full h-full flex flex-col justify-between items-center relative overflow-hidden bg-sky-gradient">
      
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-200/90 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500 mx-auto mb-4"></div>
            <p className="text-xl font-bold text-amber-900">جاري تحميل الأسئلة...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-200/90 z-50">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md text-center">
            <p className="text-2xl font-bold text-red-600 mb-4">❌ خطأ</p>
            <p className="text-lg text-gray-700 mb-6">{error}</p>
            <button
              onClick={onBackToWelcome}
              className="px-6 py-3 bg-amber-500 text-white font-bold rounded-full hover:bg-amber-600 transition-colors"
            >
              العودة
            </button>
          </div>
        </div>
      )}
      
      {/* Moving background clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[25%] left-[-15%] w-72 h-16 cloud-slow animate-cloud-move-slow" />
        <div className="absolute top-[60%] right-[-20%] w-96 h-24 cloud-fast animate-cloud-move-fast" />
      </div>

      {/* Score and HUD top layout */}
      <ScoreHUD
        lanaScore={lanaScore}
        mariaScore={mariaScore}
        currentQuestionIndex={currentIdx}
        totalQuestions={questions.length}
        timerText={formatTime(timeLeft)}
        timeLeftPercent={timeLeftPercent}
        onExit={onBackToWelcome}
        streakCount={streakCount}
      />

      {/* Center Layout: Question Box */}
      {currentQuestion && !isGameOver && (
        <div className="w-full max-w-4xl px-4 flex flex-col items-center justify-center my-auto z-10">
          
          {/* Main Question Card */}
          <div className="w-full max-w-2xl card-question rounded-[28px] py-2.5 px-4 md:py-4 md:px-6 text-center shadow-xl relative animate-bounce-subtle">
            {/* Double Border Inner Box */}
            <div className="absolute inset-1 border-2 border-amber-500 border-dashed rounded-[22px] pointer-events-none" />
            
            {/* Speaker Button */}
            <button
              type="button"
              onClick={speakCurrentWord}
              className="absolute top-3 right-3 btn-speaker hover:scale-105 active:scale-95 border-2 border-white rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer transition-transform"
              aria-label="Speak word"
            >
              <Volume2 className="w-5 h-5 text-amber-950 stroke-[2.5]" />
            </button>

            {/* Question Content - Image or Text */}
            {currentQuestion.imageUrl ? (
              <div className="flex flex-col items-center justify-center gap-1 max-w-full">
                <img 
                  src={currentQuestion.imageUrl} 
                  alt={currentQuestion.word}
                  className="max-h-16 max-w-[90%] object-contain rounded-lg shadow-sm"
                />
                <h1 className="text-base md:text-lg font-black text-amber-950 leading-tight drop-shadow-sm select-none">
                  {currentQuestion.word}
                </h1>
              </div>
            ) : (
              <h1 className="text-2xl md:text-3xl font-black text-amber-950 leading-relaxed drop-shadow-sm select-none">
                {currentQuestion.word}
              </h1>
            )}
          </div>

          {/* Feedback message banner */}
          <div className="h-6 my-2 flex items-center justify-center">
            {feedbackMsg && (
              <span className={`text-md font-black px-4 py-1 rounded-full border shadow-sm ${
                feedbackMsg.includes('رائع') 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 animate-pulse' 
                  : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}>
                {feedbackMsg}
              </span>
            )}
          </div>

          {/* Choice cards grid */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl mt-2">
            {currentQuestion.choices.map((choice, index) => {
              const isSelected = selectedAnswer === choice.text;
              const isCorrect = choice.text === checkedAnswer;
              const isMariaChoice = mariaChoice === choice.text;

              let cardStyle = "border-amber-500 bg-white text-amber-dark hover:scale-105";
              let statusOverlay = null;

              const isQuestionResolved = checkedAnswer !== null;

              if (isQuestionResolved) {
                // If the question is resolved, we reveal the correct answer and fade others
                if (isCorrect) {
                  // Correct Choice shines green
                  cardStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-correct-glow";
                  statusOverlay = (
                    <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500 rounded-[22px] flex items-center justify-center">
                      <span className="text-3xl">✅</span>
                    </div>
                  );
                } else if (isSelected) {
                  // Wrong choice by player flashes red
                  cardStyle = "border-red-500 bg-red-50 text-red-900 animate-shake shadow-incorrect-glow";
                  statusOverlay = (
                    <div className="absolute inset-0 bg-red-500/10 border-2 border-red-500 rounded-[22px] flex items-center justify-center">
                      <span className="text-3xl">❌</span>
                    </div>
                  );
                } else if (isMariaChoice) {
                  // Wrong choice by Hakeem flashes yellow
                  cardStyle = "border-amber-500 bg-amber-50 text-amber-900 opacity-60";
                  statusOverlay = (
                    <div className="absolute inset-0 bg-amber-500/20 border-2 border-amber-500 rounded-[22px] flex items-center justify-center">
                      <span className="text-xs font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">حكيم 🤖</span>
                    </div>
                  );
                } else {
                  // Other choices fade
                  cardStyle = "border-slate-200 opacity-40";
                }
              } else {
                // If not resolved yet, show wrong choices that occurred but keep other choices fully active
                if (isSelected) {
                  cardStyle = "border-red-500 bg-red-50 text-red-900 opacity-70 animate-shake";
                  statusOverlay = (
                    <div className="absolute inset-0 bg-red-500/10 border-2 border-red-500 rounded-[22px] flex items-center justify-center">
                      <span className="text-3xl">❌</span>
                    </div>
                  );
                } else if (isMariaChoice) {
                  cardStyle = "border-amber-500 bg-amber-50 text-amber-900 opacity-60";
                  statusOverlay = (
                    <div className="absolute inset-0 bg-amber-500/20 border-2 border-amber-500 rounded-[22px] flex items-center justify-center">
                      <span className="text-xs font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">حكيم 🤖</span>
                    </div>
                  );
                }
              }

              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => handlePlayerAnswer(choice.text)}
                  disabled={isQuestionResolved || choice.text === selectedAnswer || choice.text === mariaChoice}
                  className={`relative h-24 md:h-28 w-full flex flex-col items-center justify-center p-3 bg-white border-4 rounded-[22px] shadow-md cursor-pointer transition-all duration-300 ease-out select-none ${cardStyle}`}
                  aria-label={`Answer option: ${choice.text}`}
                >
                  {choice.imageUrl ? (
                    // Display image if available
                    <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 p-1">
                      <img 
                        src={choice.imageUrl} 
                        alt={choice.text}
                        className="max-h-10 max-w-full object-contain"
                      />
                      <span className="text-xs font-bold truncate max-w-full">{choice.text}</span>
                    </div>
                  ) : (
                    // Display text only
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <span className="text-sm md:text-base font-bold text-center">{choice.text}</span>
                    </div>
                  )}
                  {statusOverlay}
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* Footer Branding spacer */}
      <div className="py-2 z-10 select-none">
        <span className="text-xs font-bold text-sky-800/60 bg-sky-100/50 px-3 py-1 rounded-full border border-sky-200/50">
          لعبة مطابقة الصور العربية للأذكياء 🌟
        </span>
      </div>

      {/* Result Modal when game ends */}
      {isGameOver && (
        <ResultModal
          lanaScore={lanaScore}
          mariaScore={mariaScore}
          onRestart={initGame}
          onExit={onBackToWelcome}
        />
      )}

    </div>
  );
};
