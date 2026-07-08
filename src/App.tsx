import { useState, useEffect, useRef } from 'react';
import { type Question, getQuestionsByCategory } from './data/questions';
import { audio } from './utils/audio';
import { GameAPI, AIRPLANE_GAME_ID } from './utils/gameApi';

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  opacity: number;
  isBlack?: boolean;
}

interface ExplosionParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
}

interface LaserPath {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: 'cyan' | 'red';
  visible: boolean;
}

function App() {
  // URL Parameters
  const [urlGameId, setUrlGameId] = useState<number | null>(null);
  const [urlLessonId, setUrlLessonId] = useState<number | null>(null);
  
  // Game Configuration & Play State
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'gameover'>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [lives, setLives] = useState<number>(3); 
  const [planeLane, setPlaneLane] = useState<number>(1); 
  const [coins, setCoins] = useState<number>(0); // Changed from stars to coins
  const [monsterScale, setMonsterScale] = useState<number>(1);
  
  const [useBackend, setUseBackend] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [gameAPI, setGameAPI] = useState<GameAPI | null>(null);
  const [answersToSubmit, setAnswersToSubmit] = useState<Array<{questionId: number, answer: string, startTime: number}>>([]);
  
  // Interaction State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false); 
  const [isFlyingOver, setIsFlyingOver] = useState<boolean>(false); // Victory animation
  const [movementDir, setMovementDir] = useState<'up' | 'down' | 'none'>('none');
  
  // Styling and Animation Effects
  const [planeEffect, setPlaneEffect] = useState<'normal' | 'boost' | 'shake'>('normal');
  const [smokeParticles, setSmokeParticles] = useState<Particle[]>([]);
  const [explosionParticles, setExplosionParticles] = useState<ExplosionParticle[]>([]);
  const [laser, setLaser] = useState<LaserPath>({ x1: 0, y1: 0, x2: 0, y2: 0, color: 'cyan', visible: false });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const particleIdRef = useRef<number>(0);
  const autoAdvanceTimerRef = useRef<any>(null);
  
  const skyRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLImageElement>(null);
  const targetRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const monsterRef = useRef<HTMLImageElement>(null);

  // Initialize API and read URL parameters on mount
  useEffect(() => {
    // Read URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdParam = urlParams.get('gameId');
    const lessonIdParam = urlParams.get('lessonId');
    const tokenParam = urlParams.get('token');
    
    if (gameIdParam) setUrlGameId(parseInt(gameIdParam));
    if (lessonIdParam) setUrlLessonId(parseInt(lessonIdParam));
    
    // Get token from URL or localStorage
    let token = tokenParam || localStorage.getItem('childToken') || sessionStorage.getItem('childToken');
    
    // If token in URL, save it to localStorage for future use
    if (tokenParam) {
      localStorage.setItem('childToken', tokenParam);
      token = tokenParam;
    }
    
    if (token) {
      setGameAPI(new GameAPI(token));
      setUseBackend(true);
    }
  }, []);

  const startGame = async (category: string) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    
    setSelectedCategory(category);
    
    let questionsToUse: Question[] = [];
    
    if (useBackend && gameAPI) {
      try {
        // Use gameId and lessonId from URL if provided, otherwise use default
        const gameIdToUse = urlGameId || AIRPLANE_GAME_ID;
        const data = await gameAPI.getQuestions(gameIdToUse, urlLessonId || undefined);
        
        questionsToUse = data.questions.map((q: any) => {
          // Parse options if it's a JSON string
          const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          
          // Shuffle options randomly
          const shuffledOptions = [...options];
          for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
          }
          
          // Find the new index of the correct answer after shuffling
          const correctIndex = shuffledOptions.findIndex((opt: string) => opt === q.correctAnswer);
          
          return {
            id: q.id,
            question: q.question,
            options: shuffledOptions,
            answerIndex: correctIndex >= 0 ? correctIndex : 0,
            category: 'general' as const,
            categoryName: data.lessonName || 'أسئلة الدرس 📚'
          };
        });
        
        const session = await gameAPI.startSession(gameIdToUse, urlLessonId || undefined);
        setCurrentSessionId(session.id);
        setAnswersToSubmit([]);
      } catch (error) {
        console.error('Failed to load questions from backend:', error);
        alert('فشل تحميل الأسئلة من الخادم. تأكد من تسجيل الدخول وأن المعلم أضاف أسئلة لهذا الدرس.');
        return;
      }
    } else {
      alert('يجب تسجيل الدخول أولاً للعب اللعبة');
      return;
    }
    
    if (questionsToUse.length === 0) {
      alert('لا توجد أسئلة متاحة لهذا الدرس. يرجى التواصل مع المعلم.');
      return;
    }
    
    setQuestions(questionsToUse);
    setCurrentQuestionIndex(0);
    setLives(3);
    setPlaneLane(1);
    setCoins(0); // Reset coins
    setMonsterScale(1);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setIsCorrect(null);
    setIsShooting(false);
    setIsFlyingOver(false);
    setMovementDir('none');
    setGameState('playing');
    
    audio.setMute(isMuted);
    audio.playSuccess();
    audio.startEngine(50);

    setTimeout(() => {
      audio.speakText("مرحباً بك! لنبدأ المغامرة. أطلق شعاع الليزر على الإجابة الصحيحة لتهزم الوحش اللطيف!", 'ar-SA');
      if (questionsToUse.length > 0) {
        setTimeout(() => {
          audio.speakText(questionsToUse[0].question, 'ar-SA');
        }, 4500);
      }
    }, 500);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.setMute(nextMuted);
    if (nextMuted) {
      audio.stopEngine();
    } else {
      if (gameState === 'playing') {
        audio.startEngine(50);
      }
    }
  };

  const handleChangeLane = (newLane: number) => {
    if (newLane === planeLane) return;
    setMovementDir(newLane < planeLane ? 'up' : 'down');
    setPlaneLane(newLane);
    
    // Clear tilt to simulate inertia balancing
    setTimeout(() => {
      setMovementDir('none');
    }, 1200); // Increased timeout to match the slower 1.2s movement
  };

  // Keyboard controls
  useEffect(() => {
    if (gameState !== 'playing' || isAnswerChecked || isShooting || isFlyingOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleChangeLane(Math.max(0, planeLane - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleChangeLane(Math.min(3, planeLane + 1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleShoot(planeLane);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isAnswerChecked, isShooting, isFlyingOver, planeLane]);

  // Smoke particles
  useEffect(() => {
    if (gameState !== 'playing') {
      setSmokeParticles([]);
      return;
    }
    const interval = setInterval(() => {
      setSmokeParticles(prev => {
        const newParticles: Particle[] = [];
        
        // Engine smoke (white)
        newParticles.push({
          id: particleIdRef.current++,
          left: -15, 
          top: 35 + Math.random() * 25,
          size: 15 + Math.random() * 15,
          opacity: 0.8,
          isBlack: false
        });

        // Damage smoke (black)
        const damageLevel = 3 - lives;
        if (damageLevel > 0) {
          // Produce black smoke particles depending on damage level
          for (let i = 0; i < damageLevel; i++) {
            if (Math.random() > 0.3) {
              newParticles.push({
                id: particleIdRef.current++,
                left: Math.random() * 80 + 20, // Spread across the plane body
                top: Math.random() * 40 + 20,
                size: 20 + Math.random() * 20 * damageLevel,
                opacity: 0.6 + (damageLevel * 0.1),
                isBlack: true
              });
            }
          }
        }
        
        const updated = prev
          .map(p => ({
            ...p, left: p.left - 12, size: p.size + 1.2, opacity: p.opacity - 0.07
          }))
          .filter(p => p.opacity > 0);
        return [...newParticles, ...updated];
      });
    }, 120);
    return () => clearInterval(interval);
  }, [gameState, lives]);

  // Explosion particles animation
  useEffect(() => {
    if (explosionParticles.length === 0) return;
    let animationFrameId: number;
    let lastTime = performance.now();
    const updateParticles = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      setExplosionParticles(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + Math.cos(p.angle) * p.speed * dt,
          y: p.y + Math.sin(p.angle) * p.speed * dt,
          size: p.size * 0.95
        }));
        return next.filter(p => p.size > 0.5);
      });
      animationFrameId = requestAnimationFrame(updateParticles);
    };
    animationFrameId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animationFrameId);
  }, [explosionParticles.length]);

  const fireExplosion = (x: number, y: number, color: 'cyan' | 'red') => {
    const newParticles: ExplosionParticle[] = Array.from({ length: 20 }).map((_, i) => ({
      id: Date.now() + i,
      x, y,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 300 + 100,
      size: Math.random() * 8 + 4
    }));
    setExplosionParticles(newParticles);
  };

  const getLocalPoint = (clientX: number, clientY: number, skyRect: DOMRect, isMobilePortrait: boolean) => {
    if (isMobilePortrait) {
      const Cx = window.innerWidth / 2;
      const Cy = window.innerHeight / 2;
      const dx = clientX - Cx;
      const dy = clientY - Cy;
      const localW = window.innerHeight;
      const localH = window.innerWidth;
      return { x: dy + localW / 2, y: -dx + localH / 2 };
    } else {
      return { x: clientX - skyRect.left, y: clientY - skyRect.top };
    }
  };

  const handleShoot = (laneIndex: number) => {
    if (isAnswerChecked || isShooting || isFlyingOver) return;
    
    setPlaneLane(laneIndex);
    setSelectedAnswer(laneIndex);
    setIsShooting(true);

    const currentQuestion = questions[currentQuestionIndex];
    const correct = laneIndex === currentQuestion.answerIndex;

    // Laser Math from Plane to Target
    if (skyRef.current && planeRef.current && targetRefs.current[laneIndex]) {
      const skyRect = skyRef.current.getBoundingClientRect();
      const planeRect = planeRef.current.getBoundingClientRect();
      const targetRect = targetRefs.current[laneIndex]!.getBoundingClientRect();
      const isMobilePortrait = window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches;

      const planeNoseX = isMobilePortrait ? planeRect.left + planeRect.width * 0.5 : planeRect.left + planeRect.width;
      const planeNoseY = isMobilePortrait ? planeRect.bottom : planeRect.top + planeRect.height * 0.5;

      const startPt = getLocalPoint(planeNoseX, planeNoseY, skyRect, isMobilePortrait);
      const endPt = getLocalPoint(targetRect.left + targetRect.width * 0.5, targetRect.top + targetRect.height * 0.5, skyRect, isMobilePortrait);

      setLaser({ x1: startPt.x, y1: startPt.y, x2: endPt.x, y2: endPt.y, color: correct ? 'cyan' : 'red', visible: true });
      audio.playLaser();

      setTimeout(() => {
        setLaser(prev => ({ ...prev, visible: false }));
        
        if (correct) {
          audio.playExplosion();
          fireExplosion(endPt.x, endPt.y, 'cyan');
          handleCheckAnswer(true);
          setIsShooting(false);
        } else {
          audio.playFailure();
          fireExplosion(endPt.x, endPt.y, 'red');
          // Monster grows
          setMonsterScale(prev => Math.min(2.0, prev + 0.15));
          setIsCorrect(false);
          setIsAnswerChecked(true);
          
          // Delay before monster retaliates
          setTimeout(() => {
             triggerMonsterRetaliation(startPt);
          }, 800);
        }
      }, 250);
    } else {
      handleCheckAnswer(correct);
      setIsShooting(false);
    }
  };

  const triggerMonsterRetaliation = (planePt: {x: number, y: number}) => {
    if (skyRef.current && monsterRef.current) {
      const skyRect = skyRef.current.getBoundingClientRect();
      const monsterRect = monsterRef.current.getBoundingClientRect();
      const isMobilePortrait = window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches;
      
      const monsterMouthX = isMobilePortrait ? monsterRect.left + monsterRect.width * 0.5 : monsterRect.left;
      const monsterMouthY = isMobilePortrait ? monsterRect.top : monsterRect.top + monsterRect.height * 0.5;
      
      const monsterPt = getLocalPoint(monsterMouthX, monsterMouthY, skyRect, isMobilePortrait);

      setLaser({ x1: monsterPt.x, y1: monsterPt.y, x2: planePt.x, y2: planePt.y, color: 'red', visible: true });
      audio.playLaser();

      setTimeout(() => {
        setLaser(prev => ({ ...prev, visible: false }));
        audio.playExplosion();
        fireExplosion(planePt.x, planePt.y, 'red');
        handleDamagePlane();
      }, 300);
    } else {
      handleDamagePlane();
    }
  };

  const handleDamagePlane = () => {
    setPlaneEffect('shake');
    const newLives = lives - 1;
    setLives(newLives);

    if (newLives <= 0) {
      setTimeout(() => handleEndGame(false), 1500);
      return;
    }
    audio.speakText("إجابة خاطئة والوحش غاضب! احذر، الطائرة تتضرر!", 'ar-SA');
    
    setTimeout(() => {
      setPlaneEffect('normal');
    }, 1000);

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    autoAdvanceTimerRef.current = setTimeout(() => {
      setIsShooting(false);
      handleNextQuestion();
    }, 3000);
  };

  const handleCheckAnswer = (correct: boolean) => {
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      const newCoins = coins + 1; // Earn 1 coin per correct answer
      setCoins(newCoins);
      setPlaneEffect('boost');
      setMonsterScale(prev => Math.max(0, prev - 0.1)); // Shrink monster
      
      audio.playSuccess();
      audio.speakText("إجابة صحيحة! أحسنت يا بطل، حصلت على عملة ذهبية!", 'ar-SA');
    }

    setTimeout(() => {
      setPlaneEffect('normal');
    }, 1000);

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 3000);
  };

  const handleNextQuestion = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setIsCorrect(null);
    
    // Check if this was the last question
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      setTimeout(() => {
        audio.speakText(questions[nextIndex].question, 'ar-SA');
      }, 300);
    } else {
      // All questions completed! End game with victory
      setIsFlyingOver(true);
      audio.playWin();
      setTimeout(() => handleEndGame(true), 2500);
    }
  };

  const handleEndGame = async (won: boolean) => {
    setGameState('gameover');
    setIsFlyingOver(false);
    audio.stopEngine();
    
    if (useBackend && gameAPI && currentSessionId) {
      try {
        await gameAPI.completeSession(currentSessionId);
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }
    
    if (won) {
      audio.speakText("رائع! لقد قلصت الوحش وطرت بسلام فوقه، أنت بطل حقيقي!", 'ar-SA');
    } else {
      audio.playLose();
      audio.speakText("لقد نفذت القلوب وتدمرت الطائرة. حاول مرة أخرى لتهزمه!", 'ar-SA');
    }
  };

  const handleBackToMenu = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setGameState('welcome');
    setIsFlyingOver(false);
    audio.stopEngine();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isMobilePortrait = typeof window !== 'undefined' && window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches;
  const lanePositions = isMobilePortrait
    ? ['72%', '53%', '34%', '15%']
    : ['75%', '55%', '35%', '15%'];

  const getPlaneClass = () => {
    let classes = ['airplane-wrapper'];
    if (isFlyingOver) classes.push('plane-flyover');
    if (planeEffect === 'boost') classes.push('engine-boost');
    if (planeEffect === 'shake') classes.push('shake-drop');
    if (movementDir === 'up') classes.push('tilt-up');
    if (movementDir === 'down') classes.push('tilt-down');
    
    // Add charring effect based on damage level
    const damageLevel = 3 - lives;
    if (damageLevel === 1) classes.push('charred-1');
    if (damageLevel >= 2) classes.push('charred-2');
    
    return classes.join(' ');
  };

  return (
    <div className="app-container">
      {gameState !== 'playing' && (
        <button 
          className="sound-toggle" 
          onClick={toggleMute}
          title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
          aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
          style={{ zIndex: 100 }}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      )}

      {/* ================= WELCOME SCREEN ================= */}
      {gameState === 'welcome' && (
        <div className="welcome-screen">
          <div className="welcome-content">
            <div className="welcome-logo-container">
              <img src="/cartoon_airplane.png" className="welcome-plane" alt="طائرة كرتونية" />
            </div>
            <h1 className="welcome-title">مغامرة الطائرة والوحش ✈️👾</h1>
            <p className="welcome-subtitle">
              أطلق شعاع الليزر على الإجابة الصحيحة لتقليص الوحش وتجمع العملات! 
              احذر الإجابات الخاطئة فالوحش سيرد الهجوم وتتفحم الطائرة! أكمل جميع الأسئلة للفوز بنجمة.
            </p>

            <div className="category-selection">
              <span className="category-label">اختر مغامرتك المفضلة:</span>
              <div className="category-chips">
                <button className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>🌟 كل المغامرات</button>
                <button className={`category-chip ${selectedCategory === 'math' ? 'active' : ''}`} onClick={() => setSelectedCategory('math')}>🔢 الرياضيات الذكية</button>
                <button className={`category-chip ${selectedCategory === 'science' ? 'active' : ''}`} onClick={() => setSelectedCategory('science')}>🌿 عالم العلوم</button>
                <button className={`category-chip ${selectedCategory === 'general' ? 'active' : ''}`} onClick={() => setSelectedCategory('general')}>💡 معلومات عامة</button>
              </div>
            </div>

            <button className="start-btn" onClick={() => startGame(selectedCategory)}>
              ابدأ المغامرة الآن! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ================= GAME SCREEN (PLAYING) ================= */}
      {gameState === 'playing' && (
        <div className="sky-container" ref={skyRef}>
          
          {/* Top HUD Header */}
          <div className="sky-hud-header">
            <div className="hud-left">
              <button className="hud-back-btn" onClick={handleBackToMenu}>🏠 القائمة الرئيسية</button>
              <span className="hud-category">{currentQuestion?.categoryName}</span>
            </div>
            <div className="hud-center">
              <div className="hud-lives">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`heart-icon ${i >= lives ? 'lost' : ''}`}>❤️</span>
                ))}
              </div>
            </div>
            <div className="hud-right">
              <button className="sound-toggle-inline" onClick={toggleMute}>
                {isMuted ? "🔇" : "🔊"}
              </button>
              <div className="hud-stars">
                <span className="stars-score">🪙 {coins}</span>
                <span style={{ marginRight: '4px' }}>عملات</span>
              </div>
              <span className="hud-question-number">السؤال {currentQuestionIndex + 1}/{questions.length}</span>
            </div>
          </div>

          <div className="buildings-layer-bg" />
          <div className="clouds-container">
            <div className="cloud cloud-type-1" style={{ top: '15%', animationDuration: '30s' }} />
            <div className="cloud cloud-type-2" style={{ top: '45%', animationDuration: '45s' }} />
            <div className="cloud cloud-type-3" style={{ top: '70%', animationDuration: '35s' }} />
          </div>

          {/* Monster Character Area */}
          <div className="monster-container">
            {currentQuestion && !isFlyingOver && (
              <div className="monster-speech-bubble animate-float-fast">
                <p className="sky-question-text">{currentQuestion.question}</p>
              </div>
            )}
            <img 
              ref={monsterRef}
              src="/monster.png" 
              className="monster-img" 
              alt="الوحش" 
              style={{ transform: `scale(${monsterScale})` }}
            />
          </div>

          {/* Airplane Sprite Wrapper */}
          <div 
            className={getPlaneClass()}
            style={{ bottom: lanePositions[planeLane] }}
          >
            <img ref={planeRef} src="/cartoon_airplane.png" className="airplane-img" alt="طائرة" />
            
            {smokeParticles.map(p => (
              <div 
                key={p.id}
                className="smoke-particle"
                style={{
                  left: `${p.left}px`,
                  top: `${p.top}px`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  opacity: p.opacity,
                  backgroundColor: p.isBlack ? `rgba(20, 20, 20, ${p.opacity})` : `rgba(255, 255, 255, ${p.opacity})`
                }}
              />
            ))}
          </div>

          {/* Floating Answer Targets aligned with lanes */}
          {currentQuestion && !isFlyingOver && (
            <div className="lanes-container">
              {currentQuestion.options.map((option, idx) => {
                let targetClass = "";
                if (isAnswerChecked) {
                  if (idx === currentQuestion.answerIndex) {
                    targetClass = "correct";
                  } else if (idx === selectedAnswer) {
                    targetClass = "incorrect";
                  } else {
                    targetClass = "faded";
                  }
                } else if (planeLane === idx) {
                  targetClass = "selected-lane";
                }

                return (
                  <button
                    key={idx}
                    ref={(el) => (targetRefs.current[idx] = el)}
                    disabled={isAnswerChecked || isShooting}
                    onClick={() => handleChangeLane(idx)}
                    style={{
                      position: 'absolute',
                      bottom: lanePositions[idx],
                      right: isMobilePortrait ? '25%' : '30%',
                      zIndex: 25,
                    }}
                    className={`lane-target-btn ${targetClass}`}
                  >
                    <span className="target-badge">
                      {idx === 0 ? "أ" : idx === 1 ? "ب" : idx === 2 ? "ج" : "د"}
                    </span>
                    <span className="target-text">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Laser SVG Layer */}
          {laser.visible && (
            <svg className="laser-svg-layer">
              <defs>
                <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <line
                x1={laser.x1} y1={laser.y1} x2={laser.x2} y2={laser.y2}
                stroke={laser.color === "cyan" ? "#00E5FF" : "#EF4444"}
                strokeWidth="6" strokeLinecap="round"
                filter={laser.color === "cyan" ? "url(#glowCyan)" : "url(#glowRed)"}
              />
              <line
                x1={laser.x1} y1={laser.y1} x2={laser.x2} y2={laser.y2}
                stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"
              />
            </svg>
          )}

          {/* Explosion Particles Layer */}
          {explosionParticles.length > 0 && (
            <div className="explosion-layer">
              {explosionParticles.map((p) => (
                <div
                  key={p.id}
                  className="laser-explosion-particle"
                  style={{
                    left: p.x, top: p.y, width: p.size, height: p.size,
                    background: laser.color === "cyan" ? "#00E5FF" : "#EF4444",
                    boxShadow: `0 0 10px ${laser.color === "cyan" ? "#00E5FF" : "#EF4444"}`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="buildings-layer-fg" />

          {/* Styled Mobile Overlay Controls */}
          <div className="mobile-controls-overlay">
            <div className="d-pad-vertical">
              <button className="d-pad-btn up" disabled={isAnswerChecked || isShooting || isFlyingOver} onClick={() => handleChangeLane(Math.max(0, planeLane - 1))}>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h6v8h4v-8h6z"/></svg>
              </button>
              <button className="d-pad-btn down" disabled={isAnswerChecked || isShooting || isFlyingOver} onClick={() => handleChangeLane(Math.min(3, planeLane + 1))}>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8h-6V4h-4v8H4z"/></svg>
              </button>
            </div>
            <button className="action-fire-btn" disabled={isAnswerChecked || isShooting || isFlyingOver} onClick={() => handleShoot(planeLane)}>
              <div className="fire-btn-inner">
                <span className="fire-icon">☄️</span>
                <span className="fire-text">إطلاق</span>
              </div>
            </button>
          </div>

          {/* Bottom Action HUD */}
          {isAnswerChecked && !isFlyingOver && !isShooting && (
            <>
              <div className="sky-blur-backdrop" onClick={handleNextQuestion} />
              <div className="sky-hud-bottom">
                <div className={`hud-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect 
                    ? "ممتاز! الوحش يصغر! 🎉" 
                    : `إجابة خاطئة! الإجابة هي: (${currentQuestion.options[currentQuestion.answerIndex]})`}
                </div>
                <button className="hud-next-btn" onClick={handleNextQuestion}>
                  السؤال التالي ➡️
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= GAME OVER SCREEN ================= */}
      {gameState === 'gameover' && (
        <div className="game-over-screen">
          <div className="result-card">
            {lives > 0 ? (
              <>
                <span className="result-badge">🏆✈️⭐</span>
                <h2 className="result-title win">أنت بطل حقيقي!</h2>
                <p className="result-desc">
                  لقد أكملت جميع الأسئلة! حصلت على {coins} عملة ذهبية ونجمة واحدة! 🌟
                </p>
              </>
            ) : (
              <>
                <span className="result-badge">🔥💥🥺</span>
                <h2 className="result-title lose">الطائرة تفحمت!</h2>
                <p className="result-desc">
                  كبر الوحش كثيراً وأصاب طائرتك حتى تفحمت ونفذت محاولاتك. يمكنك الفوز في المرة القادمة!
                </p>
              </>
            )}

            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-val">🪙 {coins}</span>
                <span className="stat-lbl">العملات</span>
              </div>
              <div className="stat-item">
                <span className="stat-val">{questions.length}</span>
                <span className="stat-lbl">الأسئلة</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button className="retry-btn" onClick={() => startGame(selectedCategory)}>
                العب مرة أخرى 🔄
              </button>
              <button className="retry-btn" onClick={handleBackToMenu} style={{ background: '#64748b', boxShadow: 'none' }}>
                العودة للشاشة الرئيسية 🏠
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
