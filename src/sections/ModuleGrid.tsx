import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  BookOpen, Trophy, Gamepad2, Camera, Calendar,
  CheckCircle2, Circle, Plus, ChevronRight, Star
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// 学习基地组件
const StudyModule = () => {
  const [subjects] = useState([
    { name: '数学', progress: 75, color: 'bg-lego-red' },
    { name: '语文', progress: 60, color: 'bg-lego-blue' },
    { name: '英语', progress: 80, color: 'bg-lego-green' },
    { name: '科学', progress: 45, color: 'bg-lego-yellow' },
  ]);

  const [homework, setHomework] = useState([
    { id: 1, subject: '数学', task: '练习册 P25-27', done: false },
    { id: 2, subject: '语文', task: '背诵古诗《春晓》', done: true },
    { id: 3, subject: '英语', task: '单词听写', done: false },
  ]);

  const toggleHomework = (id: number) => {
    setHomework(homework.map(h => 
      h.id === id ? { ...h, done: !h.done } : h
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-fredoka text-xl font-bold text-white">学习基地</h3>
          <p className="font-nunito text-white/80 text-sm">超级大脑，发射！</p>
        </div>
      </div>

      {/* 学科进度 */}
      <div className="space-y-3 mb-4 flex-1">
        {subjects.map((subject, i) => (
          <div key={i} className="bg-white/20 rounded-lg p-2">
            <div className="flex justify-between text-white text-sm mb-1">
              <span>{subject.name}</span>
              <span>{subject.progress}%</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div className={`h-full ${subject.color} rounded-full transition-all duration-500`}
                   style={{ width: `${subject.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* 今日作业 */}
      <div className="bg-white/10 rounded-xl p-3">
        <p className="text-white/80 text-sm mb-2 font-semibold">今日作业</p>
        <div className="space-y-2">
          {homework.map(h => (
            <div 
              key={h.id}
              onClick={() => toggleHomework(h.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              {h.done ? 
                <CheckCircle2 className="w-4 h-4 text-lego-green" /> : 
                <Circle className="w-4 h-4 text-white/60" />
              }
              <span className={`text-sm ${h.done ? 'line-through text-white/50' : 'text-white'}`}>
                [{h.subject}] {h.task}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 体育中心组件
const SportsModule = () => {
  const [activities] = useState([
    { name: '跑步', target: 30, current: 20, unit: '分钟', icon: '🏃' },
    { name: '跳绳', target: 100, current: 150, unit: '个', icon: '🏃' },
    { name: '篮球', target: 45, current: 30, unit: '分钟', icon: '🏀' },
  ]);

  const [weeklyGoal] = useState(5);
  const [weeklyDone] = useState(3);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-fredoka text-xl font-bold text-white">体育中心</h3>
          <p className="font-nunito text-white/80 text-sm">活力无限，冲冲冲！</p>
        </div>
      </div>

      {/* 周目标 */}
      <div className="bg-white/20 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold">本周运动目标</span>
          <span className="text-white text-sm">{weeklyDone}/{weeklyGoal} 天</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: weeklyGoal }).map((_, i) => (
            <div 
              key={i}
              className={`flex-1 h-8 rounded-lg flex items-center justify-center text-lg ${
                i < weeklyDone ? 'bg-lego-yellow' : 'bg-white/30'
              }`}
            >
              {i < weeklyDone ? '⭐' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* 今日活动 */}
      <div className="space-y-3 flex-1">
        <p className="text-white/80 text-sm font-semibold">今日运动</p>
        {activities.map((activity, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{activity.icon} {activity.name}</span>
              <span className={`text-sm ${activity.current >= activity.target ? 'text-lego-green' : 'text-white/70'}`}>
                {activity.current}/{activity.target} {activity.unit}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  activity.current >= activity.target ? 'bg-lego-green' : 'bg-lego-yellow'
                }`}
                style={{ width: `${Math.min((activity.current / activity.target) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 娱乐星球组件
const GameModule = () => {
  const [highScore] = useState(1250);
  const [games] = useState([
    { name: '太空射击', plays: 23, best: 1250 },
    { name: '积木拼图', plays: 15, best: 3400 },
    { name: '记忆翻牌', plays: 8, best: 890 },
  ]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Gamepad2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-fredoka text-xl font-bold text-white">娱乐星球</h3>
          <p className="font-nunito text-white/80 text-sm">打飞机游戏 & 创意挑战</p>
        </div>
      </div>

      {/* 最高纪录 */}
      <div className="bg-white/20 rounded-xl p-4 mb-4 text-center">
        <p className="text-white/80 text-sm mb-1">太空射击最高分</p>
        <p className="font-pixel text-3xl text-lego-yellow">{highScore}</p>
      </div>

      {/* 游戏列表 */}
      <div className="space-y-2 flex-1">
        {games.map((game, i) => (
          <a 
            key={i}
            href="#game"
            className="flex items-center justify-between bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors"
          >
            <div>
              <p className="text-white font-medium">{game.name}</p>
              <p className="text-white/60 text-sm">玩过 {game.plays} 次</p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-lego-yellow" />
              <span className="text-white text-sm">{game.best}</span>
              <ChevronRight className="w-4 h-4 text-white/60" />
            </div>
          </a>
        ))}
      </div>

      <a 
        href="#game"
        className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-fredoka font-semibold py-3 rounded-xl text-center transition-colors"
      >
        开始游戏
      </a>
    </div>
  );
};

// 家庭相册组件
const GalleryModule = () => {
  const [photos] = useState([
    { id: 1, emoji: '🎂', title: '生日派对', date: '2024-01-15' },
    { id: 2, emoji: '🏖️', title: '海边度假', date: '2024-01-08' },
    { id: 3, emoji: '🎄', title: '圣诞节', date: '2023-12-25' },
    { id: 4, emoji: '🎒', title: '开学第一天', date: '2023-09-01' },
  ]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-fredoka text-xl font-bold text-white">家庭相册</h3>
          <p className="font-nunito text-white/80 text-sm">记录精彩时刻</p>
        </div>
      </div>

      {/* 照片网格 */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {photos.map((photo) => (
          <div 
            key={photo.id}
            className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors cursor-pointer group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{photo.emoji}</div>
            <p className="text-white font-medium text-sm">{photo.title}</p>
            <p className="text-white/60 text-xs">{photo.date}</p>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-fredoka font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        添加照片
      </button>
    </div>
  );
};

// 每日计划组件
const PlanModule = () => {
  const [plans, setPlans] = useState([
    { id: 1, time: '07:00', activity: '起床洗漱', done: true },
    { id: 2, time: '07:30', activity: '吃早餐', done: true },
    { id: 3, time: '08:00', activity: '上学', done: true },
    { id: 4, time: '16:00', activity: '做作业', done: false },
    { id: 5, time: '18:00', activity: '运动时间', done: false },
    { id: 6, time: '21:00', activity: '睡觉', done: false },
  ]);

  const togglePlan = (id: number) => {
    setPlans(plans.map(p => 
      p.id === id ? { ...p, done: !p.done } : p
    ));
  };

  const completedCount = plans.filter(p => p.done).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-lego-black/20 rounded-xl flex items-center justify-center">
          <Calendar className="w-6 h-6 text-lego-black" />
        </div>
        <div>
          <h3 className="font-fredoka text-xl font-bold text-lego-black">每日计划</h3>
          <p className="font-nunito text-lego-black/70 text-sm">任务达成，耶！</p>
        </div>
      </div>

      {/* 完成进度 */}
      <div className="bg-lego-yellow/30 rounded-xl p-3 mb-4">
        <div className="flex justify-between text-lego-black text-sm mb-2">
          <span className="font-semibold">今日完成度</span>
          <span>{completedCount}/{plans.length}</span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden">
          <div 
            className="h-full bg-lego-green rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / plans.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 计划列表 */}
      <div className="space-y-2 flex-1 overflow-auto">
        {plans.map(plan => (
          <div 
            key={plan.id}
            onClick={() => togglePlan(plan.id)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              plan.done ? 'bg-lego-green/20' : 'bg-lego-gray hover:bg-lego-gray-dark/20'
            }`}
          >
            <span className={`font-mono font-bold text-sm ${plan.done ? 'text-lego-green' : 'text-lego-black/50'}`}>
              {plan.time}
            </span>
            <span className={`flex-1 font-nunito ${plan.done ? 'line-through text-lego-black/50' : 'text-lego-black'}`}>
              {plan.activity}
            </span>
            {plan.done ? 
              <CheckCircle2 className="w-5 h-5 text-lego-green" /> : 
              <Circle className="w-5 h-5 text-lego-black/30" />
            }
          </div>
        ))}
      </div>
    </div>
  );
};

// 主模块网格
const ModuleGrid = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('.module-card');
      if (cards) {
        cards.forEach((card, i) => {
          gsap.fromTo(card,
            { y: 80, opacity: 0, rotationX: 20 },
            {
              y: 0,
              opacity: 1,
              rotationX: 0,
              duration: 0.8,
              delay: i * 0.1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        });
      }
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={gridRef} className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-fredoka text-3xl sm:text-4xl font-bold text-lego-black text-center mb-8">
          创意乐园
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
          {/* 学习基地 - 红色 */}
          <div id="study" className="module-card lego-brick-red rounded-lego p-5 min-h-[360px]">
            <StudyModule />
          </div>

          {/* 体育中心 - 蓝色 */}
          <div id="sports" className="module-card lego-brick-blue rounded-lego p-5 min-h-[360px]">
            <SportsModule />
          </div>

          {/* 娱乐星球 - 绿色 */}
          <div id="game" className="module-card lego-brick-green rounded-lego p-5 min-h-[360px]">
            <GameModule />
          </div>

          {/* 家庭相册 - 黑色 */}
          <div id="gallery" className="module-card lego-brick-black rounded-lego p-5 min-h-[360px]">
            <GalleryModule />
          </div>

          {/* 每日计划 - 黄色 */}
          <div id="plan" className="module-card lego-brick-white rounded-lego p-5 min-h-[360px] md:col-span-2 lg:col-span-1">
            <PlanModule />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModuleGrid;
