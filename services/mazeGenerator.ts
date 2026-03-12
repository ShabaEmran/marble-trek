
import { LevelConfig } from '../types';

export const generateLevel = (id: number): LevelConfig => {
  // We'll use a path-finding approach to create a long winding bridge
  const size = 40; 
  const maze: number[][] = Array(size).fill(0).map(() => Array(size).fill(1)); // 1 is void/water, 0 is path

  let currX = 2;
  let currZ = 2;
  maze[currX][currZ] = 0;

  const path: {x: number, z: number}[] = [{x: currX, z: currZ}];
  
  // Length of the main track increases with level
  const trackLength = 100 + (id * 10);
  let direction = { x: 1, z: 0 }; // Initial direction

  for (let i = 0; i < trackLength; i++) {
    // Occasionally change direction
    if (Math.random() > 0.8) {
      const turn = Math.random() > 0.5 ? 1 : -1;
      // Rotate 90 degrees
      const newDirX = -direction.z * turn;
      const newDirZ = direction.x * turn;
      
      // Boundary check for the "grid"
      const nextX = currX + newDirX * 2;
      const nextZ = currZ + newDirZ * 2;

      if (nextX > 1 && nextX < size - 2 && nextZ > 1 && nextZ < size - 2) {
        direction = { x: newDirX, z: newDirZ };
      }
    }

    currX += direction.x;
    currZ += direction.z;

    // Safety bounds
    if (currX <= 1 || currX >= size - 2 || currZ <= 1 || currZ >= size - 2) {
        // Bounce back logic
        direction.x *= -1;
        direction.z *= -1;
        currX += direction.x * 2;
        currZ += direction.z * 2;
    }

    maze[currX][currZ] = 0;
    path.push({x: currX, z: currZ});
  }

  // Set Goal at the end of the path
  const lastPoint = path[path.length - 1];
  maze[lastPoint.x][lastPoint.z] = 2;

  // Generate Coins along the path
  const coins: { x: number; z: number }[] = [];
  const targetCoins = 25;
  
  for (let i = 0; i < targetCoins; i++) {
    const randomStep = Math.floor(Math.random() * (path.length - 10)) + 5;
    const spot = path[randomStep];
    if (!coins.some(c => c.x === spot.x && c.z === spot.z)) {
        coins.push(spot);
    }
  }

  return { id, width: size, height: size, maze, coins };
};
