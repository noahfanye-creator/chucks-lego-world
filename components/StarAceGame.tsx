import React, { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type?: string;
  canDropPowerup?: boolean;
  life?: number;
  maxLife?: number;
  vx?: number;
  vy?: number;
  size?: number;
  color?: string;
  lastShoot?: number;
}

// 难度配置
const DIFFICULTY_CONFIG = {
  easy: {
    name: '简单',
    enemySpeed: 1.5,
    enemySpawnInterval: 2500,
    enemyShootInterval: 3000,
    speedIncreaseRate: 0.0001,
    spawnIncreaseRate: 0.00005,
    enemyCountMultiplier: 1
  },
  medium: {
    name: '中等',
    enemySpeed: 2.5,
    enemySpawnInterval: 1800,
    enemyShootInterval: 2000,
    speedIncreaseRate: 0.0002,
    spawnIncreaseRate: 0.0001,
    enemyCountMultiplier: 1.5
  },
  hard: {
    name: '困难',
    enemySpeed: 3.5,
    enemySpawnInterval: 1200,
    enemyShootInterval: 1500,
    speedIncreaseRate: 0.0003,
    spawnIncreaseRate: 0.00015,
    enemyCountMultiplier: 2
  }
};

const CONFIG = {
  BULLET_SPEED: 8,
  ENEMY_BULLET_SPEED: 5,
  PLAYER_HP: 3,
  INVINCIBLE_TIME: 1500,
  POWERUP_DURATION: 10000,
  SHIELD_DURATION: 10000,
  POWERUP_DROP_RATE: 0.25
};

export const StarAceGame: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [playerHP, setPlayerHP] = useState(3);
  const [doubleFire, setDoubleFire] = useState(false);
  const [wideBullets, setWideBullets] = useState(false);
  const [shield, setShield] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showStartButton, setShowStartButton] = useState(false);
  
  const scoreRef = useRef(0);
  const playerRef = useRef<GameObject>({ x: 0, y: 0, width: 40, height: 40, speed: 0 });
  const playerBulletsRef = useRef<GameObject[]>([]);
  const enemyBulletsRef = useRef<GameObject[]>([]);
  const enemiesRef = useRef<GameObject[]>([]);
  const powerupsRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<GameObject[]>([]);
  const starsRef = useRef<GameObject[]>([]);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const lastShootTimeRef = useRef<number>(0);
  const lastEnemyShootRef = useRef<number>(0);
  const invincibleRef = useRef<boolean>(false);
  const invincibleTimerRef = useRef<number>(0);
  const doubleFireTimerRef = useRef<number>(0);
  const wideBulletsTimerRef = useRef<number>(0);
  const shieldTimerRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);
  const baseEnemySpeedRef = useRef<number>(0);
  const baseSpawnIntervalRef = useRef<number>(0);

  const initGame = (canvas: HTMLCanvasElement) => {
    playerRef.current = {
      x: canvas.width / 2 - 20,
      y: canvas.height - 100,
      width: 40,
      height: 40,
      speed: 0
    };
    playerBulletsRef.current = [];
    enemyBulletsRef.current = [];
    enemiesRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setPlayerHP(CONFIG.PLAYER_HP);
    setDoubleFire(false);
    setWideBullets(false);
    setShield(false);
    invincibleRef.current = false;
    gameTimeRef.current = 0;
    
    starsRef.current = [];
    for (let i = 0; i < 100; i++) {
      starsRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 1
      } as GameObject);
    }
  };

  const createExplosion = (x: number, y: number) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        maxLife: 30,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 60 + 10}, 100%, ${Math.random() * 30 + 50}%)`
      } as GameObject);
    }
  };

  const spawnPowerup = (x: number, y: number) => {
    const types = ['doubleFire', 'wideBullets', 'shield', 'heal'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerupsRef.current.push({
      x: x - 15,
      y: y,
      width: 30,
      height: 30,
      speed: 3,
      type: type
    } as GameObject);
  };

  const takeDamage = () => {
    const newHP = playerHP - 1;
    setPlayerHP(newHP);
    invincibleRef.current = true;
    invincibleTimerRef.current = Date.now();
    createExplosion(playerRef.current.x + playerRef.current.width / 2, playerRef.current.y + playerRef.current.height / 2);
    
    if (newHP <= 0) {
      setGameActive(false);
      onGameOver(scoreRef.current);
    }
  };

  const selectDifficulty = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    const config = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
    baseEnemySpeedRef.current = config.enemySpeed;
    baseSpawnIntervalRef.current = config.enemySpawnInterval;
    setShowStartButton(true);
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    if (invincibleRef.current && Math.floor(Date.now() / 100) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(playerRef.current.x + playerRef.current.width / 2, playerRef.current.y + playerRef.current.height / 2);
    
    if (shield) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, playerRef.current.width / 2 + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -playerRef.current.height / 2);
    ctx.lineTo(-playerRef.current.width / 2, playerRef.current.height / 2);
    ctx.lineTo(playerRef.current.width / 2, playerRef.current.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(0, -5, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawStars = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#ffffff';
    starsRef.current.forEach(star => {
      star.y = (star.y || 0) + (star.speed || 0);
      if (star.y > (canvasRef.current?.height || 0)) {
        star.y = 0;
        star.x = Math.random() * (canvasRef.current?.width || 0);
      }
      ctx.beginPath();
      ctx.arc(star.x || 0, star.y || 0, star.size || 1, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const shoot = (time: number) => {
    const shootInterval = doubleFire ? 100 : 200;
    if (time - lastShootTimeRef.current > shootInterval) {
      lastShootTimeRef.current = time;

      if (wideBullets) {
        for (let i = -1; i <= 1; i++) {
          playerBulletsRef.current.push({
            x: playerRef.current.x + playerRef.current.width / 2 - 3 + i * 15,
            y: playerRef.current.y,
            width: 6,
            height: 15,
            speed: CONFIG.BULLET_SPEED
          });
        }
      } else {
        playerBulletsRef.current.push({
          x: playerRef.current.x + playerRef.current.width / 2 - 3,
          y: playerRef.current.y,
          width: 6,
          height: 15,
          speed: CONFIG.BULLET_SPEED
        });
      }

      if (doubleFire) {
        playerBulletsRef.current.push({
          x: playerRef.current.x + playerRef.current.width / 2 - 3,
          y: playerRef.current.y - 10,
          width: 6,
          height: 15,
          speed: CONFIG.BULLET_SPEED
        });
      }
    }
  };

  const enemyShoot = (time: number) => {
    if (!selectedDifficulty) return;
    const config = DIFFICULTY_CONFIG[selectedDifficulty as keyof typeof DIFFICULTY_CONFIG];
    const shootInterval = config.enemyShootInterval;

    enemiesRef.current.forEach(enemy => {
      if (time - (enemy.lastShoot || 0) > shootInterval && enemy.y > 50) {
        enemy.lastShoot = time;
        enemyBulletsRef.current.push({
          x: enemy.x + enemy.width / 2 - 3,
          y: enemy.y + enemy.height,
          width: 6,
          height: 15,
          speed: CONFIG.ENEMY_BULLET_SPEED
        });
      }
    });
  };

  const update = (time: number) => {
    if (!gameActive || !canvasRef.current || !selectedDifficulty) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    gameTimeRef.current += deltaTime;

    const config = DIFFICULTY_CONFIG[selectedDifficulty as keyof typeof DIFFICULTY_CONFIG];

    ctx.fillStyle = '#0a1a2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStars(ctx);
    shoot(time);
    enemyShoot(time);

    spawnTimerRef.current += deltaTime;
    const currentSpawnInterval = Math.max(800, baseSpawnIntervalRef.current - gameTimeRef.current * config.spawnIncreaseRate);
    if (spawnTimerRef.current > currentSpawnInterval) {
      const enemyCount = Math.floor(1 + gameTimeRef.current * config.enemyCountMultiplier * 0.0001);
      for (let i = 0; i < Math.min(enemyCount, 3); i++) {
        enemiesRef.current.push({
          x: Math.random() * (canvas.width - 40),
          y: -40 - i * 60,
          width: 40,
          height: 40,
          speed: baseEnemySpeedRef.current + gameTimeRef.current * config.speedIncreaseRate,
          canDropPowerup: Math.random() < CONFIG.POWERUP_DROP_RATE,
          lastShoot: 0
        } as GameObject);
      }
      spawnTimerRef.current = 0;
    }

    playerBulletsRef.current = playerBulletsRef.current.filter(b => {
      b.y -= b.speed;
      return b.y > -b.height;
    });

    enemyBulletsRef.current = enemyBulletsRef.current.filter(b => {
      b.y += b.speed;
      return b.y < canvas.height + b.height;
    });

    const currentSpeed = baseEnemySpeedRef.current + gameTimeRef.current * config.speedIncreaseRate;
    enemiesRef.current.forEach((enemy, eIdx) => {
      enemy.speed = currentSpeed;
      enemy.y += enemy.speed;

      playerBulletsRef.current.forEach((bullet, bIdx) => {
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          enemiesRef.current.splice(eIdx, 1);
          playerBulletsRef.current.splice(bIdx, 1);
          scoreRef.current += 10;
          setScore(scoreRef.current);
          if (enemy.canDropPowerup) {
            spawnPowerup(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          }
        }
      });
    });

    enemiesRef.current = enemiesRef.current.filter(e => e.y < canvas.height);

    if (!shield && !invincibleRef.current) {
      enemyBulletsRef.current.forEach((bullet, bIdx) => {
        if (
          playerRef.current.x < bullet.x + bullet.width &&
          playerRef.current.x + playerRef.current.width > bullet.x &&
          playerRef.current.y < bullet.y + bullet.height &&
          playerRef.current.y + playerRef.current.height > bullet.y
        ) {
          takeDamage();
          enemyBulletsRef.current.splice(bIdx, 1);
        }
      });

      enemiesRef.current.forEach((enemy, eIdx) => {
        if (
          playerRef.current.x < enemy.x + enemy.width &&
          playerRef.current.x + playerRef.current.width > enemy.x &&
          playerRef.current.y < enemy.y + enemy.height &&
          playerRef.current.y + playerRef.current.height > enemy.y
        ) {
          takeDamage();
          enemiesRef.current.splice(eIdx, 1);
        }
      });
    }

    powerupsRef.current.forEach((powerup, pIdx) => {
      powerup.y += powerup.speed;

      if (
        playerRef.current.x < powerup.x + powerup.width &&
        playerRef.current.x + playerRef.current.width > powerup.x &&
        playerRef.current.y < powerup.y + powerup.height &&
        playerRef.current.y + playerRef.current.height > powerup.y
      ) {
        if (powerup.type === 'doubleFire') {
          setDoubleFire(true);
          doubleFireTimerRef.current = Date.now();
        } else if (powerup.type === 'wideBullets') {
          setWideBullets(true);
          wideBulletsTimerRef.current = Date.now();
        } else if (powerup.type === 'shield') {
          setShield(true);
          shieldTimerRef.current = Date.now();
        } else if (powerup.type === 'heal' && playerHP < CONFIG.PLAYER_HP) {
          setPlayerHP(playerHP + 1);
        }
        powerupsRef.current.splice(pIdx, 1);
      }
    });

    powerupsRef.current = powerupsRef.current.filter(p => p.y < canvas.height + p.height);

    if (invincibleRef.current && Date.now() - invincibleTimerRef.current > CONFIG.INVINCIBLE_TIME) {
      invincibleRef.current = false;
    }

    if (doubleFire && Date.now() - doubleFireTimerRef.current > CONFIG.POWERUP_DURATION) {
      setDoubleFire(false);
    }

    if (wideBullets && Date.now() - wideBulletsTimerRef.current > CONFIG.POWERUP_DURATION) {
      setWideBullets(false);
    }

    if (shield && Date.now() - shieldTimerRef.current > CONFIG.SHIELD_DURATION) {
      setShield(false);
    }

    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x = (particle.x || 0) + (particle.vx || 0);
      particle.y = (particle.y || 0) + (particle.vy || 0);
      particle.life = (particle.life || 0) - 1;
      const alpha = (particle.life || 0) / (particle.maxLife || 1);
      ctx.fillStyle = particle.color || '#fff';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particle.x || 0, particle.y || 0, particle.size || 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return (particle.life || 0) > 0;
    });

    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    playerBulletsRef.current.forEach(b => {
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    });

    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#dc2626';
    enemyBulletsRef.current.forEach(b => {
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    });

    enemiesRef.current.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -enemy.height / 2);
      ctx.lineTo(enemy.width / 2, 0);
      ctx.lineTo(0, enemy.height / 2);
      ctx.lineTo(-enemy.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    powerupsRef.current.forEach(powerup => {
      ctx.save();
      ctx.translate(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2);
      if (powerup.type === 'doubleFire') {
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        const outerRadius = 15;
        const innerRadius = 5;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / 5;
          const px = radius * Math.cos(angle);
          const py = radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (powerup.type === 'wideBullets') {
        ctx.fillStyle = '#a855f7';
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 2;
        const outerRadius = 15;
        const innerRadius = 5;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / 5;
          const px = radius * Math.cos(angle);
          const py = radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (powerup.type === 'shield') {
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (powerup.type === 'heal') {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        const size = 12;
        ctx.beginPath();
        ctx.moveTo(0, size / 4);
        ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, size / 4);
        ctx.bezierCurveTo(-size / 2, size / 2, 0, size * 3 / 4, 0, size);
        ctx.bezierCurveTo(0, size * 3 / 4, size / 2, size / 2, size / 2, size / 4);
        ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, size / 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    drawPlayer(ctx);

    requestAnimationFrame(update);
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

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 350;
      canvas.height = 600;
      initGame(canvas);
    }
  }, []);

  const startGame = () => {
    if (!selectedDifficulty || !canvasRef.current) return;
    initGame(canvasRef.current);
    setGameActive(true);
    lastTimeRef.current = performance.now();
    requestAnimationFrame(update);
  };

  return (
    <div className="relative w-full flex flex-col items-center bg-[#05131D] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#1a2b3c]">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
        <span className="font-cartoon text-3xl text-yellow-400 drop-shadow-md">分数: {score}</span>
        <div className="flex gap-1">
          {Array.from({ length: CONFIG.PLAYER_HP }).map((_, i) => (
            <span key={i} className={`text-2xl ${i >= playerHP ? 'opacity-30' : ''}`}>❤️</span>
          ))}
        </div>
      </div>
      {(doubleFire || wideBullets) && (
        <div className="absolute top-16 right-4 z-20 bg-black/60 px-3 py-2 rounded-lg text-yellow-400 font-bold text-lg animate-pulse">
          {doubleFire && wideBullets ? '双倍+宽范围！' : doubleFire ? '双倍火力！' : '宽范围攻击！'}
        </div>
      )}
      {shield && (
        <div className="absolute top-16 left-4 z-20 bg-blue-600/80 px-3 py-2 rounded-lg text-white font-bold text-lg animate-pulse">
          🛡️ 保护罩
        </div>
      )}
      
      <canvas 
        ref={canvasRef}
        onMouseMove={handleTouch}
        onTouchMove={handleTouch}
        className="touch-none bg-gradient-to-b from-[#0a1a2f] to-[#1a2b3c]"
      />

      {!gameActive && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center">
          <h3 className="font-cartoon text-5xl text-white mb-4">🌟 星际王牌 🌟</h3>
          {!selectedDifficulty ? (
            <>
              <p className="font-ui text-xl text-blue-200 mb-8 font-bold">选择难度开始游戏</p>
              <div className="flex flex-col gap-4 w-full max-w-xs mb-6">
                <button 
                  onClick={() => selectDifficulty('easy')}
                  className="bg-green-600 text-white font-cartoon text-2xl px-8 py-4 rounded-2xl border-b-8 border-green-800 active:translate-y-2 active:border-b-0 transition-all shadow-xl"
                >
                  简单 ⭐
                </button>
                <button 
                  onClick={() => selectDifficulty('medium')}
                  className="bg-yellow-600 text-white font-cartoon text-2xl px-8 py-4 rounded-2xl border-b-8 border-yellow-800 active:translate-y-2 active:border-b-0 transition-all shadow-xl"
                >
                  中等 ⭐⭐
                </button>
                <button 
                  onClick={() => selectDifficulty('hard')}
                  className="bg-red-600 text-white font-cartoon text-2xl px-8 py-4 rounded-2xl border-b-8 border-red-800 active:translate-y-2 active:border-b-0 transition-all shadow-xl"
                >
                  困难 ⭐⭐⭐
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-ui text-xl text-blue-200 mb-8 font-bold">
                难度: {DIFFICULTY_CONFIG[selectedDifficulty as keyof typeof DIFFICULTY_CONFIG].name}<br/>
                移动鼠标或手指控制战机
              </p>
              <button 
                onClick={startGame}
                className="bg-red-600 text-white font-cartoon text-3xl px-12 py-5 rounded-2xl border-b-8 border-red-800 active:translate-y-2 active:border-b-0 transition-all shadow-xl"
              >
                开始挑战
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
