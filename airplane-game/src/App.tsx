import { useState, useEffect, useRef } from 'react';
import { type Question, getQuestionsByCategory } from './data/questions';
import { audio } from './utils/audio';
import { fetchGameQuestions } from './utils/api';

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  opacity: number;
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
  // Game Configuration & Play State
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'gameover'>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [altitude, setAltitude] = useState<number>(50); // Starts in the middle (50%)
  const [stars, setStars] = useState<number>(0);
  
  // Interaction State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  
  // Styling and Animation Effects
  const [planeEffect, setPlaneEffect] = useState<'normal' | 'boost' | 'shake'>('normal');
  const [smokeParticles, setSmokeParticles] = useState<Particle[]>([]);
  const [explosionParticles, setExplosionParticles] = useState<ExplosionParticle[]>([]);
  const [laser, setLaser] = useState<LaserPath>({ x1: 0, y1: 0, x2: 0, y2: 0, color: 'cyan', visible: false });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const particleIdRef = useRef<number>(0);
  const skyRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<HTMLImageElement>(null);
  const targetRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const autoAdvanceTimerRef = useRef<any>(null);

  // Initialize questions and audio
  const startGame = (category: string) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    
    setSelectedCategory(category);
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdParam = urlParams.get('gameId');

  const lessonIdParam = urlParams.get('lessonId');
  const loadQuestions = async () => {
      try {
        let selectedQuestions: Question[] = [];
        if (gameIdParam) {
          const gameId = Number(gameIdParam);
          if (!Number.isNaN(gameId)) {
      const lessonId = lessonIdParam ? Number(lessonIdParam) : undefined;
      selectedQuestions = await fetchGameQuestions(gameId, lessonId);
          }
        }

        // If we were able to fetch questions from backend, use them only.
        // Do not fall back to local defaults when gameId is provided.
        if (selectedQuestions.length === 0 && gameIdParam) {
          // No questions returned from backend for this game/lesson — abort to welcome
          console.warn('No questions returned from backend for gameId=', gameIdParam, 'lessonId=', lessonIdParam);
          setQuestions([]);
          setGameState('welcome');
          return;
        }

        // Shuffle questions
        const shuffled = [...selectedQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        // Speak first question after a short delay
        if (shuffled.length > 0) {
          setTimeout(() => {
            audio.speakText(shuffled[0].question, 'ar-SA');
          }, 3000);
        }
      } catch (err) {
        // fallback to local questions on error
        const fallback = getQuestionsByCategory(category);
        setQuestions([...fallback].sort(() => Math.random() - 0.5));
      }
    };

    // load questions (async)
    void loadQuestions();
    setCurrentQuestionIndex(0);
    setAltitude(50);
    setStars(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setIsCorrect(null);
    setIsShooting(false);
    setGameState('playing');
    
    // Play sound and engines
    audio.setMute(isMuted);
    audio.playSuccess(); // Bright start chime
    audio.startEngine(50);

    // Speak welcome message
    setTimeout(() => {
      audio.speakText("مرحباً بك يا بطل! لنبدأ المغامرة ونحلق بطائرتنا عالياً!", 'ar-SA');
    }, 500);
  };

  // Handle Mute Toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.setMute(nextMuted);
    if (nextMuted) {
      audio.stopEngine();
    } else {
      if (gameState === 'playing') {
        audio.startEngine(altitude);
      }
    }
  };

  // Generate smoke particles behind the plane while playing
  useEffect(() => {
    if (gameState !== 'playing') {
      setSmokeParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setSmokeParticles(prev => {
        // Add new particle
        const newParticle: Particle = {
          id: particleIdRef.current++,
          left: -15, // Starts at the back of the spaceship (left side of the wrapper)
          top: 35 + Math.random() * 25, // Centered vertically behind the dual thrusters
          size: 15 + Math.random() * 15,
          opacity: 0.8
        };
        
        // Move existing particles further left (more negative left) and fade them out
        const updated = prev
          .map(p => ({
            ...p,
            left: p.left - 12, // decrease left to move it further to the left (behind the plane)
            size: p.size + 1.2,
            opacity: p.opacity - 0.07
          }))
          .filter(p => p.opacity > 0);

        return [newParticle, ...updated];
      });
    }, 120);

    return () => clearInterval(interval);
  }, [gameState]);

  // Adjust engine sound pitch when altitude changes
  useEffect(() => {
    if (gameState === 'playing') {
      audio.updateEnginePitch(altitude);
    }
  }, [altitude, gameState]);


  // Engine for moving explosion particles
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
        // Remove tiny particles
        return next.filter(p => p.size > 0.5);
      });
      animationFrameId = requestAnimationFrame(updateParticles);
    };
    
    animationFrameId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animationFrameId);
  }, [explosionParticles.length]);

  const handleSelectAndShoot = (optionIndex: number) => {
    if (isAnswerChecked || isShooting) return;
    setSelectedAnswer(optionIndex);
    setIsShooting(true);

    const currentQuestion = questions[currentQuestionIndex];
    const correct = optionIndex === currentQuestion.answerIndex;

    // Calculate Laser Path
    if (skyRef.current && robotRef.current && targetRefs.current[optionIndex]) {
      const skyRect = skyRef.current.getBoundingClientRect();
      const robotRect = robotRef.current.getBoundingClientRect();
      const targetRect = targetRefs.current[optionIndex]!.getBoundingClientRect();

      const isMobilePortrait = window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches;

      // Helper to map viewport coordinates to the sky-container local coordinates
      const getLocalPoint = (clientX: number, clientY: number) => {
        if (isMobilePortrait) {
          // If rotated 90deg clockwise:
          // Center of rotation is the center of the viewport
          const Cx = window.innerWidth / 2;
          const Cy = window.innerHeight / 2;
          const dx = clientX - Cx;
          const dy = clientY - Cy;
          // After rotation, container local width is physical screen height, local height is physical screen width
          const localW = window.innerHeight;
          const localH = window.innerWidth;
          return {
            x: dy + localW / 2,
            y: -dx + localH / 2
          };
        } else {
          return {
            x: clientX - skyRect.left,
            y: clientY - skyRect.top
          };
        }
      };

      // Viewport coordinates of the plane's nose
      const robotNoseX = isMobilePortrait 
        ? robotRect.left + robotRect.width * 0.5 
        : robotRect.left + robotRect.width;
      const robotNoseY = isMobilePortrait 
        ? robotRect.bottom 
        : robotRect.top + robotRect.height * 0.5;

      const startPt = getLocalPoint(robotNoseX, robotNoseY);
      const endPt = getLocalPoint(targetRect.left + targetRect.width * 0.5, targetRect.top + targetRect.height * 0.5);

      const x1 = startPt.x;
      const y1 = startPt.y;
      const x2 = endPt.x;
      const y2 = endPt.y;

      setLaser({ x1, y1, x2, y2, color: correct ? 'cyan' : 'red', visible: true });
      audio.playLaser();

      setTimeout(() => {
        // Laser hits target
        setLaser(prev => ({ ...prev, visible: false }));
        
        // Explosion Effect
        if (correct) {
          audio.playExplosion();
        } else {
          audio.playFailure();
        }

        const newParticles: ExplosionParticle[] = Array.from({ length: 20 }).map((_, i) => ({
          id: Date.now() + i,
          x: x2,
          y: y2,
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 300 + 100,
          size: Math.random() * 8 + 4
        }));
        setExplosionParticles(newParticles);
        
        // Validate answer visually
        handleCheckAnswer(correct);
        setIsShooting(false);

      }, 250); // laser duration
    } else {
      // Fallback if refs fail
      handleCheckAnswer(correct);
      setIsShooting(false);
    }
  };

  const handleCheckAnswer = (correct: boolean) => {
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      setStars(prev => prev + 1);
      setPlaneEffect('boost');
      audio.playSuccess();
      
      const newAltitude = Math.min(100, altitude + 20);
      setAltitude(newAltitude);

      if (newAltitude >= 100) {
        setTimeout(() => {
          handleEndGame(true);
        }, 1500);
        return;
      }
      
      audio.speakText("إجابة صحيحة! أحسنت يا بطل، نحن نحلق إلى الأعلى!", 'ar-SA');
    } else {
      setPlaneEffect('shake');
      
      const newAltitude = Math.max(0, altitude - 20);
      setAltitude(newAltitude);

      if (newAltitude <= 0) {
        setTimeout(() => {
          handleEndGame(false);
        }, 1500);
        return;
      }
      
      audio.speakText("إجابة خاطئة. لا تقلق، طائرتك قوية وستحاول مجدداً!", 'ar-SA');
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
    setExplosionParticles([]);
    
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => {
        audio.speakText(questions[nextIndex].question, 'ar-SA');
      }, 300);
    } else {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setCurrentQuestionIndex(0);
      setTimeout(() => {
        audio.speakText(shuffled[0].question, 'ar-SA');
      }, 300);
    }
  };

  const handleEndGame = (won: boolean) => {
    setGameState('gameover');
    audio.stopEngine();
    if (won) {
      audio.playWin();
      audio.speakText("يا للروعة! لقد نجحت في إيصال الطائرة إلى الفضاء الخارجي! أنت بطل حقيقي ومستكشف متميز!", 'ar-SA');
    } else {
      audio.playLose();
      audio.speakText("لقد هبطت الطائرة بسلام على الأرض. حاول مرة أخرى لتتعلم المزيد وتطير عالياً في السماء!", 'ar-SA');
    }
  };

  const handleBackToMenu = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setGameState('welcome');
    audio.stopEngine();
  };


  const currentQuestion = questions[currentQuestionIndex];

  // Distribute targets in a curve ahead of the plane.
  // Squeeze them slightly on mobile portrait to prevent going behind the top HUD bar.
  const isMobilePortrait = typeof window !== 'undefined' && window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches;

  const targetPositions = isMobilePortrait
    ? [
        { bottom: '70%', right: '15%' },
        { bottom: '51%', right: '22%' },
        { bottom: '32%', right: '22%' },
        { bottom: '13%', right: '15%' },
      ]
    : [
        { bottom: '75%', right: '15%' },
        { bottom: '55%', right: '22%' },
        { bottom: '35%', right: '22%' },
        { bottom: '15%', right: '15%' },
      ];

  return (
    <div className="app-container">
      {/* Sound Controller (Only on welcome/gameover screens) */}
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
            <h1 className="welcome-title">مغامرة الطائرة الطائرة ✈️🚀</h1>
            <p className="welcome-subtitle">
              ساعد الطيار الصغير في الطيران بطائرته لأعلى مستوى!
              أجب عن الأسئلة بشكل صحيح لترتفع الطائرة إلى السماء والفضاء الخارجي،
              لكن انتبه، الإجابة الخاطئة تجعل الطائرة تهبط لأسفل!
            </p>

            <div className="category-selection">
              <span className="category-label">اختر مغامرتك المفضلة:</span>
              <div className="category-chips">
                <button 
                  className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  🌟 كل المغامرات
                </button>
                <button 
                  className={`category-chip ${selectedCategory === 'math' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('math')}
                >
                  🔢 الرياضيات الذكية
                </button>
                <button 
                  className={`category-chip ${selectedCategory === 'science' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('science')}
                >
                  🌿 عالم العلوم
                </button>
                <button 
                  className={`category-chip ${selectedCategory === 'general' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('general')}
                >
                  💡 معلومات عامة
                </button>
              </div>
            </div>

            <button 
              className="start-btn" 
              onClick={() => startGame(selectedCategory)}
            >
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
              {/* Logo Removed as per request */}
            </div>
            <div className="hud-right">
              <button 
                className="sound-toggle-inline" 
                onClick={toggleMute}
                title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
              <div className="hud-stars">
                <span className="stars-score">⭐ {stars}</span>
                <span style={{ marginRight: '4px' }}>نجوم</span>
              </div>
              <span className="hud-question-number">السؤال {currentQuestionIndex + 1}</span>
            </div>
          </div>

          {/* Distant Buildings Layer (behind plane) */}
          <div className="buildings-layer-bg" />

          {/* Clouds Overlay */}
          <div className="clouds-container">
            {altitude >= 20 && altitude <= 80 && (
              <>
                <div className="cloud cloud-type-1" style={{ top: '15%', animationDuration: '30s' }} />
                <div className="cloud cloud-type-2" style={{ top: '45%', animationDuration: '45s' }} />
                <div className="cloud cloud-type-3" style={{ top: '70%', animationDuration: '35s' }} />
              </>
            )}
          </div>

          {/* Airplane Sprite Wrapper */}
          <div 
            className={`airplane-wrapper ${planeEffect === 'boost' ? 'engine-boost' : ''} ${planeEffect === 'shake' ? 'shake-drop' : ''}`}
            style={{
              bottom: `calc(10% + ${altitude * 0.75}%)`,
              left: '20%'
            }}
          >
            {/* Question Bubble: above plane normally, below when near top */}
            {currentQuestion && (() => {
              const isMobilePortrait = typeof window !== 'undefined' && window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches;
              const isHigh = altitude >= (isMobilePortrait ? 62 : 80);
              return (
                <div 
                  className={`sky-question-bubble animate-float-fast ${isHigh ? 'bubble-below' : ''}`}
                  style={{ 
                    ...(isHigh
                      ? { top: '120%', bottom: 'auto' }
                      : { bottom: '120%', top: 'auto' }),
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    width: 'max-content'
                  }}
                >
                  <div className={`sky-question-card ${isHigh ? 'bubble-card-below' : ''}`}>
                    <p className="sky-question-text">{currentQuestion.question}</p>
                  </div>
                </div>
              );
            })()}

            <img 
              ref={robotRef}
              src="/cartoon_airplane.png" 
              className="airplane-img" 
              alt="طائرة" 
            />
            
            {/* Dynamic Engine Smoke trail */}
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
                  backgroundColor: altitude > 70 
                    ? `rgba(236, 72, 153, ${p.opacity})` // Cosmic pink smoke in space!
                    : `rgba(255, 255, 255, ${p.opacity})` // White smoke in normal sky
                }}
              />
            ))}
          </div>

          {/* Floating Answer Targets in Front of the Plane */}
          {currentQuestion && (
            <>
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
                } else if (selectedAnswer === idx) {
                  targetClass = "selected";
                }

                return (
                  <button
                    key={idx}
                    ref={(el) => (targetRefs.current[idx] = el)}
                    disabled={isAnswerChecked || isShooting}
                    onClick={() => handleSelectAndShoot(idx)}
                    style={{
                      position: 'absolute',
                      bottom: targetPositions[idx].bottom,
                      right: targetPositions[idx].right,
                      zIndex: 25,
                    }}
                    className={`sky-target-btn ${targetClass}`}
                  >
                    <span className="target-text">{option}</span>
                    <span className="target-badge">
                      {idx === 0 ? "أ" : idx === 1 ? "ب" : idx === 2 ? "ج" : "د"}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {/* Close Buildings Layer (in front of plane) */}
          <div className="buildings-layer-fg" />

          {/* Vertical Altitude Thermometer Gauge */}
          <div className="gauge-container" style={{ top: '15%', height: '70%' }}>
            <span className="gauge-trophy" title="الفضاء الخارجي!">👑🚀</span>
            <div 
              className="gauge-fill" 
              style={{ height: `${altitude}%` }}
            >
              <div className="gauge-marker">
                <span>{altitude}%</span>
                <span>📈</span>
              </div>
            </div>
            <span className="gauge-danger-icon" title="الأرض">🏡</span>
          </div>

          {/* Absolute laser beam SVG layer */}
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
                x1={laser.x1}
                y1={laser.y1}
                x2={laser.x2}
                y2={laser.y2}
                stroke={laser.color === "cyan" ? "#00E5FF" : "#EF4444"}
                strokeWidth="6"
                strokeLinecap="round"
                filter={laser.color === "cyan" ? "url(#glowCyan)" : "url(#glowRed)"}
              />
              <line
                x1={laser.x1}
                y1={laser.y1}
                x2={laser.x2}
                y2={laser.y2}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
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
                    left: p.x,
                    top: p.y,
                    width: p.size,
                    height: p.size,
                    background: laser.color === "cyan" ? "#00E5FF" : "#EF4444",
                    boxShadow: `0 0 10px ${laser.color === "cyan" ? "#00E5FF" : "#EF4444"}`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Backdrop Blur Overlay & Bottom Action HUD */}
          {isAnswerChecked && (
            <>
              <div className="sky-blur-backdrop" onClick={handleNextQuestion} />
              <div className="sky-hud-bottom">
                <div className={`hud-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect 
                    ? "ممتاز! إجابة صحيحة وطائرتك تحلق لأعلى! 🎉🚀" 
                    : `إجابة غير صحيحة، الإجابة الصحيحة هي: (${currentQuestion.options[currentQuestion.answerIndex]}) 🥺`}
                </div>
                <button className="hud-next-btn" onClick={handleNextQuestion}>
                  السؤال التالي ➡️
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= GAME OVER / RESULT OVERLAY SCREEN ================= */}
      {gameState === 'gameover' && (
        <div className="game-over-screen">
          <div className="result-card">
            {altitude >= 100 ? (
              <>
                <span className="result-badge">🏆🚀🪐</span>
                <h2 className="result-title win">لقد فزت باللقب! فوز ساحق!</h2>
                <p className="result-desc">
                  رائع جداً! لقد نجحت في الإجابة على الأسئلة بذكاء وساعدت الطائرة على اختراق الغيوم والوصول إلى الفضاء الخارجي بين النجوم والكواكب!
                </p>
              </>
            ) : (
              <>
                <span className="result-badge">✈️🪂🏡</span>
                <h2 className="result-title lose">محاولة رائعة!</h2>
                <p className="result-desc">
                  لقد هبطت الطائرة بسلام على الأرض. لا تيأس يا بطل، فالمحاولة والتعلم هما طريق النجاح! طائرتك مستعدة دائماً للطيران مجدداً معك!
                </p>
              </>
            )}

            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-val">⭐ {stars}</span>
                <span className="stat-lbl">النجوم المجمعة</span>
              </div>
              <div className="stat-item">
                <span className="stat-val">{altitude}%</span>
                <span className="stat-lbl">أقصى ارتفاع</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button 
                className="retry-btn"
                onClick={() => startGame(selectedCategory)}
              >
                العب مرة أخرى 🔄
              </button>
              <button 
                className="retry-btn"
                onClick={handleBackToMenu}
                style={{ background: '#64748b', boxShadow: 'none' }}
              >
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
