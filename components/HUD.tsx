
import React from 'react';
import { GameScore } from '../types';

interface HUDProps {
  score: GameScore;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const HUD: React.FC<HUDProps> = ({ score }) => {
  return (
    <div className="fixed top-0 left-0 right-0 pointer-events-none p-4 sm:p-6 z-40 flex flex-col items-center">
      <div className="flex flex-col items-center pointer-events-auto">
        {/* Timer Display */}
        <div className="font-bungee text-white text-4xl sm:text-5xl tracking-tight select-none drop-shadow-[0_4px_0px_rgba(0,0,0,0.3)]">
          {formatTime(score.levelTime)}
        </div>
        
        <div className="mt-2 flex items-center gap-4 bg-black/30 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full border border-white shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
              <span className="font-bungee text-yellow-300 text-sm tracking-widest">
                {score.levelCoins} / {score.levelTotalCoins}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
