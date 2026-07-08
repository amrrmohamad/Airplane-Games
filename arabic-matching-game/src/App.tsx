import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameScreen } from './components/GameScreen';

function App() {
  const [view, setView] = useState<'welcome' | 'playing'>('welcome');

  return (
    <div className="w-screen h-screen overflow-hidden">
      {view === 'welcome' && (
        <WelcomeScreen onStart={() => setView('playing')} />
      )}
      {view === 'playing' && (
        <GameScreen onBackToWelcome={() => setView('welcome')} />
      )}
    </div>
  );
}

export default App;
