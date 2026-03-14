import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Play, Pause, RotateCcw, Trophy, Target } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  isBoosted?: boolean;
}

interface EnemyBullet {
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
  shoots: boolean;
  lastShot: number;
}

interface Reward {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'shield' | 'bulletBoost' | 'life';
  emoji: string;
  sparkle: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const DIFFICULTY_CONFIG = {
  easy: { spawnMs: 2200, enemySpeed: 1, shooterRatio: 0.2, enemyBulletMs: 2000, rewardChance: 0.12, lifeChance: 0.08 },
  medium: { spawnMs: 1500, enemySpeed: 1.8, shooterRatio: 0.5, enemyBulletMs: 1400, rewardChance: 0.1, lifeChance: 0.05 },
  hard: { spawnMs: 900, enemySpeed: 2.8, shooterRatio: 0.85, enemyBulletMs: 800, rewardChance: 0.08, lifeChance: 0.03 },
};

const REWARD_ITEMS: { type: 'shield' | 'bulletBoost' | 'life'; emoji: string }[] = [
  { type: 'shield', emoji: '🛡️' },
  { type: 'bulletBoost', emoji: '⚡' },
  { type: 'life', emoji: '❤️' },
];

const SpaceShooterGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(1250);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const gameState = useRef({
    playerX: 200,
    playerY: 350,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    enemyBullets: [] as EnemyBullet[],
    rewards: [] as Reward[],
    particles: [] as Particle[],
    lastBulletTime: 0,
    lastEnemyTime: 0,
    lastRewardTime: 0,
    shieldUntil: 0,
    bulletBoostUntil: 0,
    enemySpeed: 1,
    frameCount: 0,
    difficulty: 'medium' as Difficulty,
  });

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 450;
  const PLAYER_SIZE = 40;
  const BULLET_SPEED = 8;
  const ENEMY_BULLET_SPEED = 5;
  const ENEMY_EMOJIS = ['👾', '🤖', '👽', '🛸', '☄️'];
  const AUTO_FIRE_MS = 120;
  const SHIELD_DURATION_MS = 10000;
  const BULLET_BOOST_DURATION_MS = 10000;

  const startGame = (mode: Difficulty) => {
    setDifficulty(mode);
    setIsPlaying(true);
    setIsPaused(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    const cfg = DIFFICULTY_CONFIG[mode];
    gameState.current = {
      playerX: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      playerY: CANVAS_HEIGHT - PLAYER_SIZE - 20,
      bullets: [],
      enemies: [],
      enemyBullets: [],
      rewards: [],
      particles: [],
      lastBulletTime: 0,
      lastEnemyTime: 0,
      lastRewardTime: 0,
      shieldUntil: 0,
      bulletBoostUntil: 0,
      enemySpeed: cfg.enemySpeed,
      frameCount: 0,
      difficulty: mode,
    };
  };

  // 暂停/继续
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setDifficulty(null);
  };

  const pickRewardType = (mode: Difficulty): 'shield' | 'bulletBoost' | 'life' => {
    const cfg = DIFFICULTY_CONFIG[mode];
    const r = Math.random();
    if (r < cfg.lifeChance) return 'life';
    if (r < cfg.lifeChance + 0.5) return 'shield';
    return 'bulletBoost';
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

  const loseLife = useCallback((currentScore: number) => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
        setHighScore(h => (currentScore > h ? currentScore : h));
      }
      return newLives;
    });
  }, []);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameState.current;
    const now = Date.now();
    state.frameCount++;
    const cfg = DIFFICULTY_CONFIG[state.difficulty];
    const spawnInterval = Math.max(400, cfg.spawnMs - Math.min(score * 4, 600));
    const hasShield = now < state.shieldUntil;
    const hasBoost = now < state.bulletBoostUntil;
    const fireInterval = hasBoost ? AUTO_FIRE_MS / 3 : AUTO_FIRE_MS;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = ((state.frameCount * 0.5 + i * 73) % CANVAS_WIDTH);
      const y = ((state.frameCount * 0.3 + i * 37) % CANVAS_HEIGHT);
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // 1. 自动发射子弹（一直发射）
    if (now - state.lastBulletTime >= fireInterval) {
      const bw = hasBoost ? 12 : 8;
      const bh = hasBoost ? 22 : 15;
      const n = hasBoost ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const ox = n === 1 ? 0 : (i - 1) * 18;
        state.bullets.push({
          x: state.playerX + PLAYER_SIZE / 2 - bw / 2 + ox,
          y: state.playerY,
          width: bw,
          height: bh,
          isBoosted: hasBoost,
        });
      }
      state.lastBulletTime = now;
    }

    // 2. 生成敌人（含随机射击型）
    if (now - state.lastEnemyTime > spawnInterval) {
      const enemyType = Math.floor(Math.random() * ENEMY_EMOJIS.length);
      const shoots = Math.random() < cfg.shooterRatio;
      state.enemies.push({
        x: Math.random() * (CANVAS_WIDTH - 40),
        y: -40,
        width: 35,
        height: 35,
        type: enemyType,
        emoji: ENEMY_EMOJIS[enemyType],
        shoots,
        lastShot: now,
      });
      state.lastEnemyTime = now;
    }

    // 3. 敌人移动、射击、与玩家碰撞
    state.enemies = state.enemies.filter(enemy => {
      enemy.y += state.enemySpeed + score * 0.008;

      if (enemy.shoots && now - enemy.lastShot > cfg.enemyBulletMs) {
        state.enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 4,
          y: enemy.y + enemy.height,
          width: 8,
          height: 14,
        });
        enemy.lastShot = now;
      }

      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.emoji, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2 + 10);

      if (
        enemy.x < state.playerX + PLAYER_SIZE - 10 &&
        enemy.x + enemy.width > state.playerX + 10 &&
        enemy.y < state.playerY + PLAYER_SIZE - 10 &&
        enemy.y + enemy.height > state.playerY + 10
      ) {
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6b6b');
        if (!hasShield) loseLife(score);
        return false;
      }

      if (enemy.y > CANVAS_HEIGHT) return false;
      return true;
    });

    // 4. 敌机子弹更新、与玩家碰撞（中弹减命）
    state.enemyBullets = state.enemyBullets.filter(eb => {
      eb.y += ENEMY_BULLET_SPEED;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(eb.x, eb.y, eb.width, eb.height);

      if (
        eb.x < state.playerX + PLAYER_SIZE - 8 &&
        eb.x + eb.width > state.playerX + 8 &&
        eb.y < state.playerY + PLAYER_SIZE - 8 &&
        eb.y + eb.height > state.playerY + 8
      ) {
        if (!hasShield) {
          createExplosion(state.playerX + PLAYER_SIZE / 2, state.playerY + PLAYER_SIZE / 2, '#ff6b6b');
          loseLife(score);
        }
        return false;
      }
      return eb.y < CANVAS_HEIGHT + 20;
    });

    // 5. 随机生成奖励（约每 12 秒判定一次 + 概率）
    if (now - state.lastRewardTime > 12000 && Math.random() < cfg.rewardChance) {
      state.lastRewardTime = now;
      const type = pickRewardType(state.difficulty);
      const item = REWARD_ITEMS.find(r => r.type === type)!;
      state.rewards.push({
        x: Math.random() * (CANVAS_WIDTH - 36),
        y: -30,
        width: 32,
        height: 32,
        type,
        emoji: item.emoji,
        sparkle: 0,
      });
    }

    // 6. 击杀敌人时概率掉落奖励
    state.bullets = state.bullets.filter(bullet => {
      const speed = (bullet.isBoosted ? BULLET_SPEED * 1.8 : BULLET_SPEED);
      bullet.y -= speed;

      ctx.fillStyle = bullet.isBoosted ? '#00ff88' : '#FBC02D';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.fillStyle = bullet.isBoosted ? '#00aa55' : '#F57F17';
      ctx.fillRect(bullet.x, bullet.y + bullet.height - 4, bullet.width, 4);

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

          if (Math.random() < cfg.rewardChance) {
            const rt = pickRewardType(state.difficulty);
            const ri = REWARD_ITEMS.find(r => r.type === rt)!;
            state.rewards.push({
              x: enemy.x + enemy.width / 2 - 16,
              y: enemy.y + enemy.height / 2 - 16,
              width: 32,
              height: 32,
              type: rt,
              emoji: ri.emoji,
              sparkle: 0,
            });
          }
          return false;
        }
        return true;
      });

      return bullet.y > -20 && !hit;
    });

    // 7. 奖励下落、碰到生效+特效
    state.rewards = state.rewards.filter(r => {
      r.y += 2;
      r.sparkle += 0.15;

      ctx.save();
      const glow = 0.6 + 0.4 * Math.sin(r.sparkle);
      ctx.shadowColor = r.type === 'life' ? '#ff69b4' : r.type === 'shield' ? '#4fc3f7' : '#ffee58';
      ctx.shadowBlur = 8 + 4 * Math.sin(r.sparkle);
      ctx.font = '26px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(r.emoji, r.x + r.width / 2, r.y + r.height / 2 + 10);
      ctx.restore();

      if (
        r.x < state.playerX + PLAYER_SIZE - 6 &&
        r.x + r.width > state.playerX + 6 &&
        r.y < state.playerY + PLAYER_SIZE - 6 &&
        r.y + r.height > state.playerY + 6
      ) {
        for (let i = 0; i < 14; i++) {
          const a = (Math.PI * 2 * i) / 14;
          const sp = 3 + Math.random() * 2;
          state.particles.push({
            x: r.x + r.width / 2,
            y: r.y + r.height / 2,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 25,
            color: r.type === 'life' ? '#ff69b4' : r.type === 'shield' ? '#4fc3f7' : '#ffee58',
          });
        }
        if (r.type === 'shield') state.shieldUntil = now + SHIELD_DURATION_MS;
        else if (r.type === 'bulletBoost') state.bulletBoostUntil = now + BULLET_BOOST_DURATION_MS;
        else if (r.type === 'life') setLives(prev => prev + 1);
        return false;
      }
      return r.y < CANVAS_HEIGHT + 40;
    });

    state.particles = state.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 25;
      ctx.fillRect(particle.x - 3, particle.y - 3, 6, 6);
      ctx.globalAlpha = 1;
      return particle.life > 0;
    });

    const px = state.playerX;
    const py = state.playerY;

    if (hasShield) {
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px + PLAYER_SIZE / 2, py + PLAYER_SIZE / 2, PLAYER_SIZE * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(79, 195, 247, 0.08)';
      ctx.fill();
    }

    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(px + 10, py, 20, 30);
    ctx.fillStyle = '#B71C1C';
    ctx.fillRect(px + 10, py + 25, 20, 5);
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(px, py + 15, 10, 20);
    ctx.fillRect(px + 30, py + 15, 10, 20);
    ctx.fillStyle = '#FBC02D';
    ctx.fillRect(px + 15, py + 5, 10, 10);
    if (state.frameCount % 6 < 3) {
      ctx.fillStyle = '#ff6b35';
      ctx.fillRect(px + 12, py + 30, 6, 8);
      ctx.fillRect(px + 22, py + 30, 6, 8);
    }

    if (hasBoost) {
      ctx.strokeStyle = 'rgba(255, 238, 88, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 2, py - 2, PLAYER_SIZE + 4, PLAYER_SIZE + 4);
    }

    requestAnimationFrame(gameLoop);
  }, [isPlaying, isPaused, gameOver, score, loseLife]);

  // 键盘控制：全区域移动，子弹自动发射无需按键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      const state = gameState.current;
      const speed = 12;

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, gameOver]);

  // 鼠标/触摸：在游戏框内任意位置移动（跟随指针）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (clientX: number, clientY: number) => {
      if (!isPlaying || isPaused || gameOver) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      let x = (clientX - rect.left) * scaleX - PLAYER_SIZE / 2;
      let y = (clientY - rect.top) * scaleY - PLAYER_SIZE / 2;
      x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, x));
      y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, y));
      gameState.current.playerX = x;
      gameState.current.playerY = y;
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
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
              {Array.from({ length: Math.max(3, Math.min(lives, 10)) }).map((_, i) => (
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
                <p className="font-pixel text-white text-xl mb-2 text-center">太空射击</p>
                <p className="text-white/70 text-sm mb-4 text-center px-4">
                  子弹自动发射 · 方向键/WASD 或 鼠标 移动
                </p>
                <p className="text-white/60 text-xs mb-4">选择难度</p>
                <div className="flex flex-wrap justify-center gap-3 mb-2">
                  <button
                    onClick={() => startGame('easy')}
                    className="lego-brick-green px-6 py-3 rounded-lego font-fredoka font-bold text-white"
                  >
                    简单
                  </button>
                  <button
                    onClick={() => startGame('medium')}
                    className="lego-brick-yellow px-6 py-3 rounded-lego font-fredoka font-bold text-lego-black"
                  >
                    中等
                  </button>
                  <button
                    onClick={() => startGame('hard')}
                    className="lego-brick-red px-6 py-3 rounded-lego font-fredoka font-bold text-white"
                  >
                    困难
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-2 px-4 text-center">
                  敌机发射子弹会减命 · 拾取🛡️⚡❤️获得奖励
                </p>
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
                <p className="text-white/60 text-xs mb-3">再玩一次</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button onClick={() => startGame('easy')} className="lego-brick-green px-4 py-2 rounded-lego font-fredoka font-bold text-white text-sm">简单</button>
                  <button onClick={() => startGame('medium')} className="lego-brick-yellow px-4 py-2 rounded-lego font-fredoka font-bold text-lego-black text-sm">中等</button>
                  <button onClick={() => startGame('hard')} className="lego-brick-red px-4 py-2 rounded-lego font-fredoka font-bold text-white text-sm">困难</button>
                </div>
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
            <p>🎮 方向键/WASD 或 鼠标 移动 | 子弹自动发射</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpaceShooterGame;
