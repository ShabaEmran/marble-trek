
import React from 'react';
import { GameState, GameScore } from '../types';

interface MenuProps {
  state: GameState;
  score: GameScore;
  onStart: () => void;
  onHowToPlay: () => void;
  onBack: () => void;
  onNextLevel: () => void;
  onMenu: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Menu: React.FC<MenuProps> = ({ 
  state, score, onStart, onHowToPlay, onBack, onNextLevel, onMenu 
}) => {
  const containerClass = "fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden";
  
  const woodButton = "relative group w-full max-w-[280px] py-4 px-6 rounded-xl font-bungee text-xl text-white transition-all active:scale-95 shadow-[0_6px_0px_#3E2723] hover:shadow-[0_4px_0px_#3E2723] hover:translate-y-[2px] bg-[#8D6E63] border-2 border-[#5D4037] overflow-hidden mb-4";
  const glassButton = "relative w-full max-w-[280px] py-3 px-6 rounded-xl font-bungee text-lg text-white/90 transition-all active:scale-95 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 mb-3";

  const BackgroundElements = () => (
    <div className="absolute inset-0 pointer-events-none -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF8A65] via-[#E64A19] to-[#BF360C]" />
      <div className="absolute top-1/4 left-[-10%] w-[120%] h-[60%] bg-white/5 blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#004E7C] opacity-40 blur-3xl" />
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute bg-white rounded-full opacity-30 animate-twinkle"
          style={{
            width: Math.random() * 3 + 'px',
            height: Math.random() * 3 + 'px',
            top: Math.random() * 80 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 5 + 's'
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.6; } }
        .animate-twinkle { animation: twinkle 3s infinite ease-in-out; }
      `}</style>
    </div>
  );

  const Panel = ({ children, title, subtitle }: { children?: React.ReactNode, title?: string, subtitle?: string }) => (
    <div className="relative w-full max-w-sm bg-white/10 backdrop-blur-3xl p-8 rounded-[2.5rem] border-2 border-white/20 shadow-2xl flex flex-col items-center">
      <div className="absolute -top-5 bg-[#8D6E63] px-6 py-2 rounded-full border-2 border-[#5D4037] shadow-lg">
        <span className="font-bungee text-white text-sm tracking-widest">{title || 'SYSTEM'}</span>
      </div>
      {subtitle && <p className="mt-4 font-bungee text-white/90 text-xs tracking-[0.2em] mb-6">{subtitle}</p>}
      <div className="w-full flex flex-col items-center mt-2">
        {children}
      </div>
    </div>
  );

  const HeaderBranding = () => (
    <div className="relative mb-8 flex flex-col items-center">
      <div className="relative w-28 h-28 mb-4">
        <div className="absolute inset-0 bg-white rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] animate-float">
           <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-400 rounded-full" />
           <div className="absolute top-[10%] left-[15%] w-10 h-5 bg-white/60 rounded-full blur-lg rotate-[-30deg]" />
        </div>
        <style>{`
          @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
          .animate-float { animation: float 4s infinite ease-in-out; }
        `}</style>
      </div>
      <div className="text-center">
        <h1 className="font-bungee text-5xl text-white tracking-tighter drop-shadow-[0_4px_0px_#5D4037]">MARBLE</h1>
        <h1 className="font-bungee text-5xl text-yellow-400 tracking-tighter -mt-2 drop-shadow-[0_4px_0px_#5D4037]">TREK</h1>
      </div>
    </div>
  );

  if (state === GameState.INTRO) {
    return (
      <div className={containerClass}>
        <BackgroundElements />
        <HeaderBranding />
        <div className="w-full flex flex-col items-center z-10">
          <button onClick={onStart} className={woodButton}>
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
            <span className="relative">START VOYAGE</span>
          </button>
          <button onClick={onHowToPlay} className={glassButton}>HOW TO PLAY</button>
          <div className="mt-8 flex items-center gap-2 opacity-30">
            <div className="h-px w-8 bg-white" />
            <span className="font-bungee text-[10px] text-white tracking-[0.4em]">SUNSET EXPEDITION</span>
            <div className="h-px w-8 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (state === GameState.GAME_OVER) {
    return (
      <div className={containerClass}>
        <BackgroundElements />
        <div className="absolute inset-0 bg-rose-900/30 pointer-events-none" />
        <HeaderBranding />
        <Panel title="VOYAGE FAILED" subtitle="THE OCEAN HAS CLAIMED YOUR TREK">
          <div className="w-full space-y-3 mb-8">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="font-bungee text-white/60 text-xs">GOLD RECOVERED</span>
              <span className="font-bungee text-yellow-400 text-xl">{score.levelCoins}</span>
            </div>
          </div>
          <button onClick={onMenu} className={woodButton}>RETURN TO PORT</button>
        </Panel>
      </div>
    );
  }

  if (state === GameState.LEVEL_COMPLETE) {
    return (
      <div className={containerClass}>
        <BackgroundElements />
        <HeaderBranding />
        <Panel title="SUCCESS" subtitle="VOYAGE ACCOMPLISHED">
          <div className="w-full bg-white/10 rounded-2xl p-6 mb-8 border border-white/10">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bungee text-white/40 text-[9px] block mb-1">VOYAGE TIME</span>
                <span className="font-bungee text-white text-2xl">{formatTime(score.levelTime)}</span>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bungee text-white/40 text-[9px] block mb-1">GOLD PIECES</span>
                <span className="font-bungee text-yellow-400 text-2xl">{score.levelCoins} / {score.levelTotalCoins}</span>
              </div>
            </div>
            
            <div className="text-center py-4 border-t border-white/10">
               <span className="font-bungee text-white/50 text-[10px] tracking-[0.3em] uppercase block mb-1">VOYAGE SCORE</span>
               <span className="font-bungee text-white text-5xl tracking-tighter drop-shadow-[0_4px_0px_rgba(0,0,0,0.2)]">
                 {score.levelPoints.toLocaleString()}
               </span>
            </div>
          </div>
          <button onClick={onNextLevel} className={woodButton}>
            CONTINUE TREK
          </button>
          <button onClick={onMenu} className={glassButton}>MAIN MENU</button>
        </Panel>
      </div>
    );
  }

  if (state === GameState.HOW_TO_PLAY) {
    return (
      <div className={containerClass}>
        <BackgroundElements />
        <Panel title="CAPTAIN'S LOG" subtitle="MASTER THE MARBLE">
          <div className="space-y-6 w-full mb-8">
            {[
              { label: 'STEER', desc: 'Use the golden orb to tilt the world.', icon: '🕹️' },
              { label: 'SPEED', desc: 'Finish quickly to earn a higher Time Bonus.', icon: '⏱️' },
              { label: 'GOLD', desc: 'Each coin is worth 1,000 points.', icon: '💰' },
              { label: 'SURVIVE', desc: 'Don\'t fall into the deep sunset ocean.', icon: '⚓' }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl border border-white/20">{item.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bungee text-white text-xs tracking-widest">{item.label}</h4>
                  <p className="text-white/70 text-[10px] leading-tight font-bold">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onBack} className={woodButton}>AYE, CAPTAIN!</button>
        </Panel>
      </div>
    );
  }

  return null;
};

export default Menu;
