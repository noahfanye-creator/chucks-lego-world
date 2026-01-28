import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Play, Pause, RotateCcw, Trophy, Target } from 'lucide-react';

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  type: number;
  emoji: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const SpaceShooterGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(1250);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);

  // 游戏状态
  const gameState = useRef({
    playerX: 200,
    playerY: 350,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    lastBulletTime: 0,
    lastEnemyTime: 0,
    enemySpeed: 1,
    frameCount: 0,
  });

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 450;
  const PLAYER_SIZE = 40;
  const BULLET_SPEED = 8;
  const ENEMY_EMOJIS = ['👾', '🤖', '👽', '🛸', '☄️'];

  // 开始游戏
  const startGame = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    gameState.current = {
      playerX: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      playerY: CANVAS_HEIGHT - PLAYER_SIZE - 20,
      bullets: [],
      enemies: [],
      particles: [],
      lastBulletTime: 0,
      lastEnemyTime: 0,
      enemySpeed: 1.5,
      frameCount: 0,
    };
  };

  // 暂停/继续
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 重置游戏
  const resetGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
  };

  // 创建爆炸粒子
  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3;
      gameState.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        color,
      });
    }
  };

  // 游戏主循环
  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameState.current;
    state.frameCount++;

    // 清空画布
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制星空背景
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = ((state.frameCount * 0.5 + i * 73) % CANVAS_WIDTH);
      const y = ((state.frameCount * 0.3 + i * 37) % CANVAS_HEIGHT);
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // 生成敌人
    if (Date.now() - state.lastEnemyTime > 1500 - Math.min(score * 5, 800)) {
      const enemyType = Math.floor(Math.random() * ENEMY_EMOJIS.length);
      state.enemies.push({
        x: Math.random() * (CANVAS_WIDTH - 40),
        y: -40,
        width: 35,
        height: 35,
        type: enemyType,
        emoji: ENEMY_EMOJIS[enemyType],
      });
      state.lastEnemyTime = Date.now();
    }

    // 更新和绘制敌人
    state.enemies = state.enemies.filter(enemy => {
      enemy.y += state.enemySpeed + score * 0.01;

      // 绘制敌人
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.emoji, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2 + 10);

      // 检测与玩家碰撞
      if (
        enemy.x < state.playerX + PLAYER_SIZE - 10 &&
        enemy.x + enemy.width > state.playerX + 10 &&
        enemy.y < state.playerY + PLAYER_SIZE - 10 &&
        enemy.y + enemy.height > state.playerY + 10
      ) {
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6b6b');
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            if (score > highScore) {
              setHighScore(score);
            }
          }
          return newLives;
        });
        return false;
      }

      // 敌人到达底部
      if (enemy.y > CANVAS_HEIGHT) {
        return false;
      }

      return true;
    });

    // 更新和绘制子弹
    state.bullets = state.bullets.filter(bullet => {
      bullet.y -= BULLET_SPEED;

      // 绘制子弹（乐高风格）
      ctx.fillStyle = '#FBC02D';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.fillStyle = '#F57F17';
      ctx.fillRect(bullet.x, bullet.y + bullet.height - 4, bullet.width, 4);

      // 检测碰撞
      let hit = false;
      state.enemies = state.enemies.filter(enemy => {
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          hit = true;
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#4ade80');
          setScore(prev => prev + 10 + enemy.type * 5);
          return false;
        }
        return true;
      });

      return bullet.y > -10 && !hit;
    });

    // 更新和绘制粒子
    state.particles = state.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 30;
      ctx.fillRect(particle.x - 3, particle.y - 3, 6, 6);
      ctx.globalAlpha = 1;

      return particle.life > 0;
    });

    // 绘制玩家（乐高飞船）
    const px = state.playerX;
    const py = state.playerY;
    
    // 飞船主体
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(px + 10, py, 20, 30);
    ctx.fillStyle = '#B71C1C';
    ctx.fillRect(px + 10, py + 25, 20, 5);
    
    // 飞船翅膀
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(px, py + 15, 10, 20);
    ctx.fillRect(px + 30, py + 15, 10, 20);
    
    // 驾驶舱
    ctx.fillStyle = '#FBC02D';
    ctx.fillRect(px + 15, py + 5, 10, 10);
    
    // 引擎火焰
    if (state.frameCount % 6 < 3) {
      ctx.fillStyle = '#ff6b35';
      ctx.fillRect(px + 12, py + 30, 6, 8);
      ctx.fillRect(px + 22, py + 30, 6, 8);
    }

    requestAnimationFrame(gameLoop);
  }, [isPlaying, isPaused, gameOver, score, highScore]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;

      const state = gameState.current;
      const speed = 15;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          state.playerX = Math.max(0, state.playerX - speed);
          break;
        case 'ArrowRight':
        case 'd':
          state.playerX = Math.min(CANVAS_WIDTH - PLAYER_SIZE, state.playerX + speed);
          break;
        case 'ArrowUp':
        case 'w':
          state.playerY = Math.max(0, state.playerY - speed);
          break;
        case 'ArrowDown':
        case 's':
          state.playerY = Math.min(CANVAS_HEIGHT - PLAYER_SIZE, state.playerY + speed);
          break;
        case ' ':
          if (Date.now() - state.lastBulletTime > 200) {
            state.bullets.push({
              x: state.playerX + PLAYER_SIZE / 2 - 4,
              y: state.playerY,
              width: 8,
              height: 15,
            });
            state.lastBulletTime = Date.now();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, gameOver]);

  // 鼠标/触摸控制
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const handleMove = (clientX: number) => {
      if (!isPlaying || isPaused || gameOver) return;
      const rect = gameArea.getBoundingClientRect();
      const x = clientX - rect.left;
      gameState.current.playerX = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, x - PLAYER_SIZE / 2));
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    const handleClick = () => {
      if (!isPlaying || isPaused || gameOver) return;
      const state = gameState.current;
      if (Date.now() - state.lastBulletTime > 200) {
        state.bullets.push({
          x: state.playerX + PLAYER_SIZE / 2 - 4,
          y: state.playerY,
          width: 8,
          height: 15,
        });
        state.lastBulletTime = Date.now();
      }
    };

    gameArea.addEventListener('mousemove', handleMouseMove);
    gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameArea.addEventListener('click', handleClick);

    return () => {
      gameArea.removeEventListener('mousemove', handleMouseMove);
      gameArea.removeEventListener('touchmove', handleTouchMove);
      gameArea.removeEventListener('click', handleClick);
    };
  }, [isPlaying, isPaused, gameOver]);

  // 启动游戏循环
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      const animationId = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animationId);
    }
  }, [isPlaying, isPaused, gameOver, gameLoop]);

  // 入场动画
  useEffect(() => {
    gsap.fromTo(gameAreaRef.current,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
    );
  }, []);

  return (
    <section className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-fredoka text-3xl sm:text-4xl font-bold text-lego-black text-center mb-8">
          太空射击
        </h2>

        <div 
          ref={gameAreaRef}
          className="relative bg-lego-black rounded-lego p-4 shadow-2xl"
        >
          {/* 游戏信息栏 */}
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-lego-yellow" />
                <span className="font-pixel text-lego-yellow text-sm">{score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-lego-green" />
                <span className="font-pixel text-lego-green text-sm">{highScore}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="text-xl">
                  {i < lives ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
          </div>

          {/* 游戏画布 */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full max-w-[400px] mx-auto rounded-lg border-4 border-lego-gray-dark cursor-crosshair"
            />

            {/* 开始/暂停/游戏结束覆盖层 */}
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
                <p className="font-pixel text-white text-xl mb-4 text-center">太空射击</p>
                <p className="text-white/70 text-sm mb-6 text-center px-4">
                  使用方向键或鼠标移动<br/>空格键或点击发射
                </p>
                <button
                  onClick={startGame}
                  className="lego-brick-green px-8 py-4 rounded-lego font-fredoka font-bold text-white flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  开始游戏
                </button>
              </div>
            )}

            {isPaused && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
                <p className="font-pixel text-white text-xl mb-4">已暂停</p>
                <button
                  onClick={togglePause}
                  className="lego-brick-yellow px-6 py-3 rounded-lego font-fredoka font-bold text-lego-black flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  继续
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
                <p className="font-pixel text-lego-red text-xl mb-2">游戏结束</p>
                <p className="text-white mb-2">得分: {score}</p>
                {score >= highScore && score > 0 && (
                  <p className="text-lego-yellow text-sm mb-4">🎉 新纪录！</p>
                )}
                <button
                  onClick={startGame}
                  className="lego-brick-blue px-6 py-3 rounded-lego font-fredoka font-bold text-white flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  再玩一次
                </button>
              </div>
            )}
          </div>

          {/* 控制按钮 */}
          {isPlaying && !gameOver && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={togglePause}
                className="lego-brick-yellow px-4 py-2 rounded-lego font-fredoka font-semibold text-lego-black flex items-center gap-2"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? '继续' : '暂停'}
              </button>
              <button
                onClick={resetGame}
                className="lego-brick-red px-4 py-2 rounded-lego font-fredoka font-semibold text-white flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
            </div>
          )}

          {/* 操作说明 */}
          <div className="mt-4 text-center text-white/60 text-sm">
            <p>🎮 方向键/WASD 移动 | 空格/点击 射击</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpaceShooterGame;
