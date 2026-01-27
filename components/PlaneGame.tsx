
import React, { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  emoji: string;
}

export const PlaneGame: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const scoreRef = useRef(0);
  
  // Game state refs for the animation loop
  const playerRef = useRef<GameObject>({ x: 0, y: 0, width: 40, height: 40, speed: 0, emoji: '✈️' });
  const bulletsRef = useRef<GameObject[]>([]);
  const enemiesRef = useRef<GameObject[]>([]);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const initGame = (canvas: HTMLCanvasElement) => {
    playerRef.current = {
      x: canvas.width / 2 - 20,
      y: canvas.height - 80,
      width: 40,
      height: 40,
      speed: 0,
      emoji: '✈️'
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
  };

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (!gameActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const x = clientX - rect.left;
    playerRef.current.x = Math.max(0, Math.min(canvas.width - playerRef.current.width, x - playerRef.current.width / 2));
  };

  const update = (time: number) => {
    if (!gameActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (simple stars/dots)
    ctx.fillStyle = '#ffffff22';
    for(let i=0; i<10; i++) {
        ctx.beginPath();
        ctx.arc((time/10 + i*50) % canvas.width, (time/5 + i*100) % canvas.height, 2, 0, Math.PI*2);
        ctx.fill();
    }

    // Spawn enemies
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current > 1000) {
      enemiesRef.current.push({
        x: Math.random() * (canvas.width - 40),
        y: -40,
        width: 40,
        height: 40,
        speed: 2 + Math.random() * 2,
        emoji: ['👾', '🛸', '🚀'][Math.floor(Math.random() * 3)]
      });
      spawnTimerRef.current = 0;
    }

    // Auto-fire bullets
    if (Math.floor(time / 200) > Math.floor((time - deltaTime) / 200)) {
      bulletsRef.current.push({
        x: playerRef.current.x + playerRef.current.width / 2 - 5,
        y: playerRef.current.y,
        width: 10,
        height: 20,
        speed: 7,
        emoji: '🟡'
      });
    }

    // Update & Draw Bullets
    bulletsRef.current = bulletsRef.current.filter(b => b.y > -20);
    bulletsRef.current.forEach(b => {
      b.y -= b.speed;
      ctx.font = '20px Arial';
      ctx.fillText(b.emoji, b.x, b.y);
    });

    // Update & Draw Enemies
    enemiesRef.current.forEach((enemy, eIdx) => {
      enemy.y += enemy.speed;
      ctx.font = '30px Arial';
      ctx.fillText(enemy.emoji, enemy.x, enemy.y + 30);

      // Collision with player
      if (
        enemy.x < playerRef.current.x + playerRef.current.width &&
        enemy.x + enemy.width > playerRef.current.x &&
        enemy.y < playerRef.current.y + playerRef.current.height &&
        enemy.y + enemy.height > playerRef.current.y
      ) {
        setGameActive(false);
        onGameOver(scoreRef.current);
      }

      // Collision with bullets
      bulletsRef.current.forEach((bullet, bIdx) => {
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          enemiesRef.current.splice(eIdx, 1);
          bulletsRef.current.splice(bIdx, 1);
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }
      });
    });

    // Remove off-screen enemies
    enemiesRef.current = enemiesRef.current.filter(e => e.y < canvas.height);

    // Draw Player
    ctx.font = '40px Arial';
    ctx.fillText(playerRef.current.emoji, playerRef.current.x, playerRef.current.y + 35);

    requestAnimationFrame(update);
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 350;
      canvas.height = 500;
      initGame(canvas);
    }
  }, []);

  const startGame = () => {
    if (canvasRef.current) {
        initGame(canvasRef.current);
        setGameActive(true);
        lastTimeRef.current = performance.now();
        requestAnimationFrame(update);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center bg-[#05131D] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#1a2b3c]">
      <div className="absolute top-4 left-4 z-20">
        <span className="font-cartoon text-3xl text-yellow-400 drop-shadow-md">分数: {score}</span>
      </div>
      
      <canvas 
        ref={canvasRef}
        onMouseMove={handleTouch}
        onTouchMove={handleTouch}
        className="touch-none bg-gradient-to-b from-[#0a1a2f] to-[#1a2b3c]"
      />

      {!gameActive && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center">
          <h3 className="font-cartoon text-5xl text-white mb-4">乐高王牌飞行员</h3>
          <p className="font-ui text-xl text-blue-200 mb-8 font-bold">左右拖动飞机躲避敌人！</p>
          <button 
            onClick={startGame}
            className="bg-red-600 text-white font-cartoon text-3xl px-12 py-5 rounded-2xl border-b-8 border-red-800 active:translate-y-2 active:border-b-0 transition-all shadow-xl"
          >
            开始挑战
          </button>
        </div>
      )}
    </div>
  );
};
