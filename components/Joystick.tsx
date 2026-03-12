
import React, { useState, useRef, useEffect } from 'react';

interface JoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const radiusRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    // Capture the pointer so we get events even outside the element
    containerRef.current.setPointerCapture(e.pointerId);
    
    const rect = containerRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    radiusRef.current = rect.width / 2;
    
    setActive(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active) return;
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!active) return;
    setActive(false);
    setPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
    
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const updatePosition = (clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = radiusRef.current;

    let finalX = dx;
    let finalY = dy;

    if (dist > max) {
      finalX = dx * (max / dist);
      finalY = dy * (max / dist);
    }

    setPos({ x: finalX, y: finalY });
    // Normalize to -1 to 1 range
    onMove({ x: finalX / max, y: -finalY / max });
  };

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-56 h-56 z-50 pointer-events-none flex items-center justify-center">
      <div 
        ref={containerRef}
        className={`w-40 h-40 rounded-full border-4 border-white/20 bg-black/15 backdrop-blur-xl pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-transform duration-300 ${active ? 'scale-110' : 'opacity-70'}`}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Outer Ring Accent */}
        <div className={`absolute inset-0 rounded-full border-2 border-yellow-400/30 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Joystick Handle */}
        <div 
          style={{ 
            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            transition: active ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          className="absolute top-1/2 left-1/2 w-20 h-20 bg-yellow-400 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-4 border-white flex items-center justify-center"
        >
          {/* Internal detail for the ball handle */}
          <div className="absolute top-2 left-3 w-6 h-4 bg-white/40 rounded-full blur-[1px]" />
          <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-black/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Joystick;
