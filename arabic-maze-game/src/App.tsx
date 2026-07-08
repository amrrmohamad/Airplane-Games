import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { gameAudio } from './utils/audio';
import { GameAPI, ARABIC_MAZE_GAME_ID, type Question } from './utils/gameApi';

type ViewType = 'welcome' | 'playing' | 'gameover' | 'victory';

function App() {
  const [view, setView] = useState<ViewType>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  // API state
  const [gameAPI, setGameAPI] = useState<GameAPI | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlGameId, setUrlGameId] = useState<number | null>(null);
  const [urlLessonId, setUrlLessonId] = useState<number | null>(null);

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

  // Load questions from backend
  useEffect(() => {
    if (!gameAPI) return;
    
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const gameIdToUse = urlGameId || ARABIC_MAZE_GAME_ID;
        const data = await gameAPI.getQuestions(gameIdToUse, urlLessonId || undefined);
        
        if (data.questions.length === 0) {
          setError('لا توجد أسئلة متاحة لهذا الدرس');
          setLoading(false);
          return;
        }
        
        // Transform backend questions to maze game format
        const transformedQuestions = data.questions.map((q: any) => {
          const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          
          // Shuffle all options randomly
          const shuffledOptions = [...options];
          for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
          }
          
          // For maze game: question = word, options = distractors (excluding correct answer)
          return {
            id: q.id,
            image: q.imageUrl || 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=400', // Fallback image
            word: q.correctAnswer || q.question,
            distractors: shuffledOptions.filter((opt: string) => opt !== q.correctAnswer).slice(0, 3)
          };
        });
        
        setQuestions(transformedQuestions);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load questions:', err);
        setError('فشل تحميل الأسئلة من الخادم');
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, [gameAPI, urlGameId, urlLessonId]);

  const handleStartGame = async () => {
    if (!gameAPI || questions.length === 0) return;
    
    try {
      const gameIdToUse = urlGameId || ARABIC_MAZE_GAME_ID;
      const session = await gameAPI.startSession(gameIdToUse, urlLessonId || undefined);
      setSessionId(session.id);
      
      setScore(0);
      setLives(3);
      setCurrentQuestionIndex(0);
      setView('playing');
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError('فشل بدء الجلسة');
    }
  };

  const handleCorrectAnswer = () => {
    setScore((prev) => prev + 100);
    
    // Check if there are more questions
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Complete session
      if (gameAPI && sessionId) {
        gameAPI.completeSession(sessionId).catch(err => {
          console.error('Failed to complete session:', err);
        });
      }
      setView('victory');
    }
  };

  const handleWrongAnswer = () => {
    setScore((prev) => Math.max(0, prev - 20));
  };

  const handleLoseLife = () => {
    setLives((prev) => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        gameAudio.playGameOver();
        setView('gameover');
      }
      return nextLives;
    });
  };

  if (loading) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white">جاري تحميل الأسئلة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md text-center">
          <p className="text-2xl font-bold text-red-600 mb-4">❌ خطأ</p>
          <p className="text-lg text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen overflow-x-hidden flex items-center justify-center">
      {view === 'welcome' && (
        <WelcomeScreen onStart={handleStartGame} />
      )}
      
      {view === 'playing' && questions.length > 0 && (
        <GameScreen
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          score={score}
          lives={lives}
          onCorrectAnswer={handleCorrectAnswer}
          onWrongAnswer={handleWrongAnswer}
          onLoseLife={handleLoseLife}
          onBackToWelcome={() => setView('welcome')}
        />
      )}

      {view === 'gameover' && (
        <GameOverModal
          score={score}
          level={currentQuestionIndex + 1}
          onRestart={handleStartGame}
          onHome={() => setView('welcome')}
        />
      )}

      {view === 'victory' && (
        <VictoryModal
          score={score}
          onRestart={handleStartGame}
          onHome={() => setView('welcome')}
        />
      )}
    </div>
  );
}

export default App;
