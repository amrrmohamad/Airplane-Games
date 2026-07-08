import React, { useEffect, useRef } from 'react';
import { gameAudio } from '../utils/audio';
import robotImg from '../assets/robot.png';

// 19x19 Maze Grid Layout (1 = Wall, 0 = Path)
const MAZE_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // TL Room (cols 1..3), TR Room (cols 15..17)
  [1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], // Room entry doors at col 4 and 14
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Center Row (player starts at 9, 9)
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], // BL Room (cols 1..3), BR Room (cols 15..17)
  [1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Room Centers & Colors
const ROOMS = [
  { id: 0, x: 2, y: 2, label: 'أعلى اليسار', color: '#39ff14', glow: 'rgba(57, 255, 20, 0.15)' }, // TL
  { id: 1, x: 16, y: 2, label: 'أعلى اليمين', color: '#bd00ff', glow: 'rgba(189, 0, 255, 0.15)' }, // TR
  { id: 2, x: 2, y: 16, label: 'أسفل اليسار', color: '#ff5f00', glow: 'rgba(255, 95, 0, 0.15)' }, // BL
  { id: 3, x: 16, y: 16, label: 'أسفل اليمين', color: '#ff007f', glow: 'rgba(255, 0, 127, 0.15)' } // BR
];

interface Monster {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  personality: 'chaser' | 'random';
}

interface MazeCanvasProps {
  words: string[]; // 4 words distributed to the 4 rooms
  correctWord: string;
  onCorrect: () => void;
  onWrong: (word: string) => void;
  onLoseLife: () => void;
  lives: number;
  isPaused: boolean;
  externalDirection: string | null; // For on-screen controls
}

export const MazeCanvas: React.FC<MazeCanvasProps> = ({
  words,
  correctWord,
  onCorrect,
  onWrong,
  onLoseLife,
  lives,
  isPaused,
  externalDirection,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const robotImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = robotImg;
    img.onload = () => {
      robotImageRef.current = img;
    };
  }, []);

  // Player state
  const playerRef = useRef({
    x: 9 * 32 + 16,
    y: 9 * 32 + 16,
    gridX: 9,
    gridY: 9,
    targetX: 9,
    targetY: 9,
    speed: 4,
    dir: 'none',
    nextDir: 'none',
    invincibleFrames: 0,
    facingDir: 'left',
  });

  // Monsters state
  const monstersRef = useRef<Monster[]>([]);

  // Local state for wrong room cooldowns to prevent double triggers
  const lastRoomVisitedRef = useRef<{ id: number; time: number } | null>(null);

  const cellSize = 32;

  // Initialize monsters
  const resetEntities = () => {
    // Reset player
    playerRef.current = {
      x: 9 * cellSize + cellSize / 2,
      y: 9 * cellSize + cellSize / 2,
      gridX: 9,
      gridY: 9,
      targetX: 9,
      targetY: 9,
      speed: 4,
      dir: 'none',
      nextDir: 'none',
      invincibleFrames: 120, // 2 seconds safety on level start
      facingDir: 'left',
    };

    // Reset monsters based on current level / words length
    // We'll spawn 3 monsters: 1 chaser (Red), 2 random patrollers (Cyan, Orange)
    monstersRef.current = [
      {
        x: 5 * cellSize + cellSize / 2,
        y: 5 * cellSize + cellSize / 2,
        gridX: 5,
        gridY: 5,
        targetX: 5,
        targetY: 5,
        speed: 2,
        color: '#ff0000', // Red: Chaser
        personality: 'chaser'
      },
      {
        x: 13 * cellSize + cellSize / 2,
        y: 5 * cellSize + cellSize / 2,
        gridX: 13,
        gridY: 5,
        targetX: 13,
        targetY: 5,
        speed: 2,
        color: '#00f0ff', // Cyan: Random
        personality: 'random'
      },
      {
        x: 5 * cellSize + cellSize / 2,
        y: 13 * cellSize + cellSize / 2,
        gridX: 5,
        gridY: 13,
        targetX: 5,
        targetY: 13,
        speed: 2.2,
        color: '#ffaa00', // Orange: Random
        personality: 'random'
      }
    ];

    lastRoomVisitedRef.current = null;
  };

  // Reset when words/level changes
  useEffect(() => {
    resetEntities();
  }, [words]);

  const externalDirectionRef = useRef<string | null>(null);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Sync external direction (touch/mouse hold)
  useEffect(() => {
    externalDirectionRef.current = externalDirection;
  }, [externalDirection]);

  // Handle keyboard inputs with held down tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || lives <= 0) return;

      const trackedKeys = ['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S', 'ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'];
      if (trackedKeys.includes(e.key)) {
        e.preventDefault();
      }

      keysPressedRef.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = false;
    };

    const handleBlur = () => {
      keysPressedRef.current = {};
      externalDirectionRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPaused, lives]);

  const getDesiredDirection = (): string | null => {
    if (externalDirectionRef.current) {
      return externalDirectionRef.current;
    }
    const keys = keysPressedRef.current;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) return 'up';
    if (keys['ArrowDown'] || keys['s'] || keys['S']) return 'down';
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) return 'left';
    if (keys['ArrowRight'] || keys['d'] || keys['D']) return 'right';
    return null;
  };

  const isWalkable = (gx: number, gy: number): boolean => {
    if (gx < 0 || gx >= 19 || gy < 0 || gy >= 19) return false;
    return MAZE_GRID[gy][gx] !== 1;
  };

  // Main game loop inside requestAnimationFrame
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateGame = () => {
      if (isPaused || lives <= 0) return;

      const player = playerRef.current;

      // 1. Move Player
      const targetPx = player.targetX * cellSize + cellSize / 2;
      const targetPy = player.targetY * cellSize + cellSize / 2;

      // Interpolate position
      if (player.x < targetPx) player.x = Math.min(player.x + player.speed, targetPx);
      else if (player.x > targetPx) player.x = Math.max(player.x - player.speed, targetPx);

      if (player.y < targetPy) player.y = Math.min(player.y + player.speed, targetPy);
      else if (player.y > targetPy) player.y = Math.max(player.y - player.speed, targetPy);

      // Decrement invincibility
      if (player.invincibleFrames > 0) {
        player.invincibleFrames--;
      }

      // Check if player has arrived at target tile
      if (player.x === targetPx && player.y === targetPy) {
        player.gridX = player.targetX;
        player.gridY = player.targetY;

        const desiredDir = getDesiredDirection();
        let dX = 0;
        let dY = 0;

        if (desiredDir) {
          if (desiredDir === 'up' && isWalkable(player.gridX, player.gridY - 1)) dY = -1;
          else if (desiredDir === 'down' && isWalkable(player.gridX, player.gridY + 1)) dY = 1;
          else if (desiredDir === 'left' && isWalkable(player.gridX - 1, player.gridY)) {
            dX = -1;
            player.facingDir = 'left';
          }
          else if (desiredDir === 'right' && isWalkable(player.gridX + 1, player.gridY)) {
            dX = 1;
            player.facingDir = 'right';
          }

          if (dX !== 0 || dY !== 0) {
            player.dir = desiredDir;
            player.targetX = player.gridX + dX;
            player.targetY = player.gridY + dY;
            gameAudio.playMove();
          } else {
            player.dir = 'none';
          }
        } else {
          player.dir = 'none';
        }
      }

      // 2. Move Monsters
      const monsters = monstersRef.current;
      monsters.forEach((monster) => {
        const mTargetPx = monster.targetX * cellSize + cellSize / 2;
        const mTargetPy = monster.targetY * cellSize + cellSize / 2;

        // Interpolate position
        if (monster.x < mTargetPx) monster.x = Math.min(monster.x + monster.speed, mTargetPx);
        else if (monster.x > mTargetPx) monster.x = Math.max(monster.x - monster.speed, mTargetPx);

        if (monster.y < mTargetPy) monster.y = Math.min(monster.y + monster.speed, mTargetPy);
        else if (monster.y > mTargetPy) monster.y = Math.max(monster.y - monster.speed, mTargetPy);

        // Arrived at target tile
        if (monster.x === mTargetPx && monster.y === mTargetPy) {
          monster.gridX = monster.targetX;
          monster.gridY = monster.targetY;

          // Find possible moves (prevent reversing direction directly unless dead end)
          const moves = [
            { dir: 'up', dx: 0, dy: -1 },
            { dir: 'down', dx: 0, dy: 1 },
            { dir: 'left', dx: -1, dy: 0 },
            { dir: 'right', dx: 1, dy: 0 }
          ];

          // Identify current moving direction
          let curDir = 'none';
          if (monster.targetX > monster.gridX) curDir = 'right';
          else if (monster.targetX < monster.gridX) curDir = 'left';
          else if (monster.targetY > monster.gridY) curDir = 'down';
          else if (monster.targetY < monster.gridY) curDir = 'up';

          const validMoves = moves.filter((m) => {
            // Must be walkable
            if (!isWalkable(monster.gridX + m.dx, monster.gridY + m.dy)) return false;
            // Avoid opposite direction
            if (curDir === 'right' && m.dir === 'left') return false;
            if (curDir === 'left' && m.dir === 'right') return false;
            if (curDir === 'up' && m.dir === 'down') return false;
            if (curDir === 'down' && m.dir === 'up') return false;
            return true;
          });

          let chosenMove = null;

          if (validMoves.length > 0) {
            if (monster.personality === 'chaser') {
              // Red Ghost: Greedy chase towards player's grid position
              let minDistance = Infinity;
              validMoves.forEach((move) => {
                const nextGx = monster.gridX + move.dx;
                const nextGy = monster.gridY + move.dy;
                // Manhattan distance
                const dist = Math.abs(nextGx - player.gridX) + Math.abs(nextGy - player.gridY);
                if (dist < minDistance) {
                  minDistance = dist;
                  chosenMove = move;
                }
              });
            } else {
              // Random decision at intersections
              const randIdx = Math.floor(Math.random() * validMoves.length);
              chosenMove = validMoves[randIdx];
            }
          } else {
            // Dead end, must turn back
            const opposite = moves.find((m) => {
              if (curDir === 'right' && m.dir === 'left') return true;
              if (curDir === 'left' && m.dir === 'right') return true;
              if (curDir === 'up' && m.dir === 'down') return true;
              if (curDir === 'down' && m.dir === 'up') return true;
              return false;
            });
            if (opposite && isWalkable(monster.gridX + opposite.dx, monster.gridY + opposite.dy)) {
              chosenMove = opposite;
            }
          }

          if (chosenMove) {
            monster.targetX = monster.gridX + chosenMove.dx;
            monster.targetY = monster.gridY + chosenMove.dy;
          }
        }
      });

      // 3. Collision Checks (Player vs Monsters)
      if (player.invincibleFrames === 0) {
        monsters.forEach((monster) => {
          const dx = player.x - monster.x;
          const dy = player.y - monster.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Overlap check (circle radius sum roughly 24px)
          if (dist < 20) {
            gameAudio.playHit();
            onLoseLife();
            
            // Flash and reset positions
            player.invincibleFrames = 120;
            player.x = 9 * cellSize + cellSize / 2;
            player.y = 9 * cellSize + cellSize / 2;
            player.gridX = 9;
            player.gridY = 9;
            player.targetX = 9;
            player.targetY = 9;
            player.dir = 'none';
            player.nextDir = 'none';
            player.facingDir = 'left';

            // Reset monsters positions
            monsters[0].x = 5 * cellSize + cellSize / 2;
            monsters[0].y = 5 * cellSize + cellSize / 2;
            monsters[0].gridX = 5;
            monsters[0].gridY = 5;
            monsters[0].targetX = 5;
            monsters[0].targetY = 5;

            monsters[1].x = 13 * cellSize + cellSize / 2;
            monsters[1].y = 5 * cellSize + cellSize / 2;
            monsters[1].gridX = 13;
            monsters[1].gridY = 5;
            monsters[1].targetX = 13;
            monsters[1].targetY = 5;

            monsters[2].x = 5 * cellSize + cellSize / 2;
            monsters[2].y = 13 * cellSize + cellSize / 2;
            monsters[2].gridX = 5;
            monsters[2].gridY = 13;
            monsters[2].targetX = 5;
            monsters[2].targetY = 13;
          }
        });
      }

      // 4. Room Detection (Player inside corner rooms)
      ROOMS.forEach((room) => {
        // If player reaches the exact center tile of the room
        if (player.gridX === room.x && player.gridY === room.y) {
          const now = Date.now();
          const lastVisited = lastRoomVisitedRef.current;

          // Prevent immediate duplicate triggering
          if (lastVisited && lastVisited.id === room.id && now - lastVisited.time < 3000) {
            return;
          }

          const wordInRoom = words[room.id];
          lastRoomVisitedRef.current = { id: room.id, time: now };

          if (wordInRoom === correctWord) {
            onCorrect();
          } else {
            gameAudio.playWrong();
            onWrong(wordInRoom);
          }
        }
      });
    };

    const drawGame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const player = playerRef.current;
      const monsters = monstersRef.current;

      // 1. Draw Room Glow zones
      ROOMS.forEach((room) => {
        ctx.fillStyle = room.glow;
        ctx.fillRect((room.x - 1) * cellSize, (room.y - 1) * cellSize, cellSize * 3, cellSize * 3);
        
        // Neon Room Borders
        ctx.strokeStyle = room.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = room.color;
        ctx.shadowBlur = 10;
        ctx.strokeRect((room.x - 1) * cellSize, (room.y - 1) * cellSize, cellSize * 3, cellSize * 3);
      });
      ctx.shadowBlur = 0; // Reset shadows

      // 2. Draw Maze Walls
      ctx.fillStyle = '#0f172a'; // dark wall block
      ctx.strokeStyle = '#312e81'; // neon dark indigo wall border
      ctx.lineWidth = 1;

      for (let r = 0; r < 19; r++) {
        for (let c = 0; c < 19; c++) {
          if (MAZE_GRID[r][c] === 1) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

            // Neon line borders for outer edges
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 1;
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.shadowBlur = 0; // Reset
          }
        }
      }

      // 3. Draw Room Words (Arabic connected text support)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 18px Cairo';

      ROOMS.forEach((room) => {
        const textX = room.x * cellSize + cellSize / 2;
        const textY = room.y * cellSize + cellSize / 2;

        // Draw shadow/glow behind word
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 19px Cairo';
        ctx.fillText(words[room.id] || '', textX + 1, textY + 1);

        // Draw word text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Cairo';
        ctx.fillText(words[room.id] || '', textX, textY);
      });

      // 4. Draw Player
      const isInvincible = player.invincibleFrames > 0;
      // Flashing effect during invincibility
      if (!isInvincible || Math.floor(player.invincibleFrames / 5) % 2 === 0) {
        if (robotImageRef.current) {
          ctx.save();
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = isInvincible ? 15 : 6;
          const size = 26; // Fits nicely in 32x32 cell

          if (player.facingDir === 'left') {
            ctx.translate(player.x, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
              robotImageRef.current,
              -size / 2,
              -size / 2,
              size,
              size
            );
          } else {
            ctx.drawImage(
              robotImageRef.current,
              player.x - size / 2,
              player.y - size / 2,
              size,
              size
            );
          }
          ctx.restore();
          ctx.shadowBlur = 0; // Reset
        } else {
          ctx.beginPath();
          ctx.arc(player.x, player.y, 11, 0, Math.PI * 2);
          ctx.fillStyle = '#fff01f';
          ctx.fill();
        }
      }

      // 5. Draw Monsters
      monsters.forEach((monster) => {
        const mx = monster.x;
        const my = monster.y;

        // Draw ghost dome body
        ctx.beginPath();
        ctx.arc(mx, my - 2, 10, Math.PI, 0, false); // top dome
        ctx.lineTo(mx + 10, my + 10);
        
        // Wavy bottom skirt
        ctx.lineTo(mx + 6, my + 7);
        ctx.lineTo(mx + 2, my + 10);
        ctx.lineTo(mx - 2, my + 7);
        ctx.lineTo(mx - 6, my + 10);
        ctx.lineTo(mx - 10, my + 7);
        
        ctx.closePath();
        ctx.fillStyle = monster.color;
        ctx.shadowColor = monster.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // Draw white eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mx - 4, my - 2, 3, 0, Math.PI * 2);
        ctx.arc(mx + 4, my - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw pupils looking in movement direction
        ctx.fillStyle = '#0000ff';
        let pupilDx = 0;
        let pupilDy = 0;

        let mDir = 'none';
        if (monster.targetX > monster.gridX) mDir = 'right';
        else if (monster.targetX < monster.gridX) mDir = 'left';
        else if (monster.targetY > monster.gridY) mDir = 'down';
        else if (monster.targetY < monster.gridY) mDir = 'up';

        if (mDir === 'up') pupilDy = -1.5;
        else if (mDir === 'down') pupilDy = 1.5;
        else if (mDir === 'left') pupilDx = -1.5;
        else if (mDir === 'right') pupilDx = 1.5;

        ctx.beginPath();
        ctx.arc(mx - 4 + pupilDx, my - 2 + pupilDy, 1.5, 0, Math.PI * 2);
        ctx.arc(mx + 4 + pupilDx, my - 2 + pupilDy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const runFrame = () => {
      updateGame();
      drawGame();
      animationId = requestAnimationFrame(runFrame);
    };

    runFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, lives, words, correctWord]);

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center w-full max-w-[608px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-[#030712] border border-[#312e81]"
    >
      <canvas
        ref={canvasRef}
        width={19 * cellSize}
        height={19 * cellSize}
        className="block max-w-full max-h-full h-auto"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
