import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Bot, Clock, Calendar, Sun, Cloud, Star, Quote } from 'lucide-react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const LegoButler = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [quote, setQuote] = useState('');
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: '完成数学作业', completed: false },
    { id: 2, text: '阅读30分钟', completed: false },
    { id: 3, text: '运动30分钟', completed: false },
  ]);
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const botIconRef = useRef<HTMLDivElement>(null);

  const quotes = [
    '今天也是充满创造力的一天！',
    '像乐高积木一样，一块一块搭建你的梦想！',
    '每一次尝试都是成长的机会！',
    '相信自己，你可以创造出奇迹！',
    '保持好奇心，探索无限可能！',
    '失败是成功的一部分，继续加油！',
  ];

  useEffect(() => {
    // 更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 设置问候语
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('早上好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');

    // 随机选择语录
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 入场动画
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }
      );
    }, cardRef);

    return () => ctx.revert();
  }, []);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleBotHover = () => {
    gsap.to(botIconRef.current, {
      rotation: 360,
      duration: 0.6,
      ease: 'power2.out'
    });
  };

  const handleBotLeave = () => {
    gsap.to(botIconRef.current, {
      rotation: 0,
      duration: 0.3
    });
  };

  const getWeatherIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 18) return <Sun className="w-6 h-6 text-lego-yellow" />;
    return <Cloud className="w-6 h-6 text-lego-gray-dark" />;
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div 
          ref={cardRef}
          className="lego-brick-yellow rounded-lego p-6 sm:p-8 relative overflow-hidden"
        >
          {/* 光泽效果 */}
          <div className="absolute inset-0 shine-effect pointer-events-none" />
          
          {/* 乐高钉装饰 */}
          <div className="absolute -top-3 left-8 w-8 h-4 bg-lego-yellow rounded-t-full" 
               style={{ boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.4)' }} />
          <div className="absolute -top-3 right-8 w-8 h-4 bg-lego-yellow rounded-t-full"
               style={{ boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.4)' }} />
          
          <div className="relative z-10">
            {/* 头部 */}
            <div className="flex items-center gap-4 mb-6">
              <div 
                ref={botIconRef}
                onMouseEnter={handleBotHover}
                onMouseLeave={handleBotLeave}
                className="w-16 h-16 bg-lego-blue rounded-2xl flex items-center justify-center shadow-lg cursor-pointer"
              >
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-lego-black">
                  乐高小管家
                </h2>
                <p className="font-nunito text-lego-black/70">
                  {greeting}，Chuck！
                </p>
              </div>
            </div>

            {/* 信息卡片网格 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/50 rounded-xl p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-lego-red" />
                <p className="font-nunito font-bold text-lego-black text-lg">
                  {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-lego-black/60">当前时间</p>
              </div>
              
              <div className="bg-white/50 rounded-xl p-3 text-center">
                <Calendar className="w-5 h-5 mx-auto mb-1 text-lego-blue" />
                <p className="font-nunito font-bold text-lego-black text-sm">
                  {currentTime.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-lego-black/60">今天</p>
              </div>
              
              <div className="bg-white/50 rounded-xl p-3 text-center">
                {getWeatherIcon()}
                <p className="font-nunito font-bold text-lego-black text-lg">24°C</p>
                <p className="text-xs text-lego-black/60">天气</p>
              </div>
              
              <div className="bg-white/50 rounded-xl p-3 text-center">
                <Star className="w-5 h-5 mx-auto mb-1 text-lego-yellow" />
                <p className="font-nunito font-bold text-lego-black text-lg">{completedCount}/{tasks.length}</p>
                <p className="text-xs text-lego-black/60">完成任务</p>
              </div>
            </div>

            {/* 励志语录 */}
            <div className="bg-white/60 rounded-xl p-4 mb-4 flex items-start gap-3">
              <Quote className="w-5 h-5 text-lego-green flex-shrink-0 mt-1" />
              <p className="font-nunito text-lego-black font-medium italic">
                "{quote}"
              </p>
            </div>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm font-nunito text-lego-black/70 mb-2">
                <span>今日进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-4 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-lego-green to-lego-blue transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 展开/收起按钮 */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full lego-brick-blue py-3 rounded-lego font-fredoka font-semibold text-white transition-all duration-200"
            >
              {showDetails ? '收起任务列表' : '查看今日任务'}
            </button>

            {/* 任务列表 */}
            {showDetails && (
              <div className="mt-4 space-y-2 animate-accordion-down">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      task.completed ? 'bg-lego-green/20' : 'bg-white/50 hover:bg-white/70'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                      task.completed ? 'bg-lego-green border-lego-green' : 'border-lego-gray-dark'
                    }`}>
                      {task.completed && <span className="text-white text-sm">✓</span>}
                    </div>
                    <span className={`font-nunito flex-1 ${task.completed ? 'line-through text-lego-black/50' : 'text-lego-black'}`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LegoButler;
