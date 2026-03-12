
export const COLORS = {
  WALL: 0x5D4037,    // Deep Wood Brown
  FLOOR: 0x004E7C,   // Deep Ocean Water
  PATH: 0x8D6E63,    // Realistic Wood Base
  BALL: 0xFFFFFF,    // Pure Marble
  SKY: 0xFF9E80,     // Hazy Sunset Orange
  COIN: 0xFFD700,    // Gold
  GOAL: 0xFF5252,    // Vibrant Red
  MOUNTAIN: 0x2D1B18, // Dark Mountain Silhouette
};

export const PHYSICS = {
  GRAVITY: -50,      
  BALL_MASS: 2.5,
  BALL_RADIUS: 0.45,
  MAX_SPEED: 6.5,     
  MOVE_FORCE: 200,    
  DAMPING: 0.4,       
  ANGULAR_DAMPING: 0.6,
  RESTITUTION: 0.02,  
  FRICTION: 2.0,      
};

export const CAMERA = {
  HEIGHT: 13,        
  OFFSET_Z: 10,       
  LERP_FACTOR: 0.15,  
  DEFAULT_FOV: 42,
  FALL_FOV: 115,      
};

export const MAZE_CELL_SIZE = 3.2; 
export const BRIDGE_WIDTH = 5.0;   

// New Scoring Constants
export const COIN_VALUE = 1000;
export const TIME_BONUS_BASE = 5000; 
export const TIME_PENALTY_PER_SEC = 25; 
