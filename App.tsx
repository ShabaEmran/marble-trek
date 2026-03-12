
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameScore, LevelConfig } from './types';
import { generateLevel } from './services/mazeGenerator';
import { audioService } from './services/audioService';
import { COIN_VALUE, TIME_BONUS_BASE, TIME_PENALTY_PER_SEC } from './constants';
import GameContainer from './components/GameContainer';
import Menu from './components/Menu';
import HUD from './components/HUD';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [level, setLevel] = useState<number>(1);
  const [currentLevelConfig, setCurrentLevelConfig] = useState<LevelConfig | null>(null);
  const [score, setScore] = useState<GameScore>({ 
    total: 0, 
    levelPoints: 0, 
    levelCoins: 0, 
    levelTotalCoins: 0,
    levelTime: 0 
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const initAudio = () => {
      audioService.resume();
      window.removeEventListener('pointerdown', initAudio);
    };
    window.addEventListener('pointerdown', initAudio);
    return () => window.removeEventListener('pointerdown', initAudio);
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setScore(prev => ({ ...prev, levelTime: prev.levelTime + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === GameState.PREPARING) {
      const config = generateLevel(level);
      setCurrentLevelConfig(config);
      setScore(prev => ({ 
        ...prev, 
        levelPoints: 0,
        levelCoins: 0, 
        levelTime: 0,
        levelTotalCoins: config.coins.length 
      }));
      
      const timeout = setTimeout(() => {
        setGameState(GameState.PLAYING);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [gameState, level]);

  const triggerTransition = (nextState: GameState | (() => void)) => {
    setIsTransitioning(true);
    audioService.playClick();
    setTimeout(() => {
      if (typeof nextState === 'function') {
        nextState();
      } else {
        setGameState(nextState);
      }
      setTimeout(() => setIsTransitioning(false), 500);
    }, 600);
  };

  const handleStartGame = () => {
    triggerTransition(GameState.PREPARING);
  };

  const handleBackToMenu = () => {
    triggerTransition(() => {
      audioService.stopAmbient();
      setGameState(GameState.INTRO);
      setCurrentLevelConfig(null);
      setLevel(1);
      setScore({ total: 0, levelPoints: 0, levelCoins: 0, levelTotalCoins: 0, levelTime: 0 });
    });
  };

  const handleCoinCollected = useCallback(() => {
    setScore(prev => ({
      ...prev,
      levelCoins: prev.levelCoins + 1
    }));
  }, []);

  const handleLevelComplete = useCallback(() => {
    audioService.stopAmbient();
    
    setScore(prev => {
      const coinPoints = prev.levelCoins * COIN_VALUE;
      const timeBonus = Math.max(0, TIME_BONUS_BASE - (prev.levelTime * TIME_PENALTY_PER_SEC));
      const levelPoints = coinPoints + timeBonus;
      
      return { 
        ...prev, 
        levelPoints,
        total: prev.total + levelPoints 
      };
    });
    
    setGameState(GameState.LEVEL_COMPLETE);
  }, []);

  const handleNextLevel = () => {
    triggerTransition(() => {
      setLevel(prev => prev + 1);
      setCurrentLevelConfig(null);
      setGameState(GameState.PREPARING);
    });
  };

  const handleFallOff = useCallback(() => {
    // We no longer end the game on fall off. 
    // We just play a small feedback sound and let the GameContainer handle respawning.
    audioService.playHit();
  }, []);

  const handleHowToPlay = () => {
    triggerTransition(GameState.HOW_TO_PLAY);
  };

  const handleBack = () => {
    triggerTransition(GameState.INTRO);
  };

  return (
    <div className="relative w-full h-screen bg-[#ff9e80] overflow-hidden select-none touch-none">
      <div 
        className={`fixed inset-0 z-[100] bg-rose-600 transition-transform duration-700 ease-in-out pointer-events-none flex items-center justify-center
          ${isTransitioning ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="font-bungee text-white text-4xl animate-pulse">PREPARING TREK...</div>
      </div>

      {gameState === GameState.PLAYING && currentLevelConfig && (
        <>
          <GameContainer 
            levelConfig={currentLevelConfig}
            onCoinCollected={handleCoinCollected}
            onLevelComplete={handleLevelComplete}
            onFallOff={handleFallOff}
          />
          <HUD score={score} />
        </>
      )}

      {(gameState !== GameState.PLAYING && gameState !== GameState.PREPARING) && (
        <Menu 
          state={gameState}
          score={score}
          onStart={handleStartGame}
          onHowToPlay={handleHowToPlay}
          onBack={handleBack}
          onNextLevel={handleNextLevel}
          onMenu={handleBackToMenu}
        />
      )}
    </div>
  );
};

export default App;
