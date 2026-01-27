
import React, { useState, useEffect } from 'react';
import { Brick } from './components/Brick';
import { Section, Subject, Task } from './types';
import { getDailyInspiration } from './services/geminiService';
import { StarAceGame } from './components/StarAceGame';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [activeSubject, setActiveSubject] = useState<Subject>('chinese');
  const [inspiration, setInspiration] = useState<string>("正在拼装你的今日动力...");
  const [isSyncing, setIsSyncing] = useState(true);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('chuck_high_score') || '0');
  });
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: '早起阅读 20分钟', completed: false, time: '08:00' },
    { id: '2', text: '完成数学口算练习', completed: true, time: '09:30' },
    { id: '3', text: '科学小实验：浮力大挑战', completed: false, time: '14:00' },
    { id: '4', text: '户外踢足球 ⚽', completed: false, time: '16:30' },
  ]);

  useEffect(() => {
    // Simulate initial cloud sync
    setTimeout(() => {
      setIsSyncing(false);
      getDailyInspiration("Chuck").then(setInspiration);
    }, 1500);
  }, []);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleGameOver = (score: number) => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('chuck_high_score', score.toString());
    }
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-10">
        <div className="w-24 h-24 relative animate-bounce">
            <div className="absolute inset-0 bg-[#C91A09] rounded-xl shadow-xl border-b-8 border-[#8B1306]"></div>
            <div className="absolute -top-4 left-4 w-6 h-6 bg-[#C91A09] rounded-full border-t border-white/20"></div>
            <div className="absolute -top-4 right-4 w-6 h-6 bg-[#C91A09] rounded-full border-t border-white/20"></div>
        </div>
        <h2 className="mt-12 text-4xl font-cartoon text-gray-800 animate-pulse">正在进入乐高世界...</h2>
        <p className="mt-4 text-gray-400 font-ui font-bold">同步云端数据中 🧱🧱🧱</p>
      </div>
    );
  }

  const renderHome = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6">
      <div className="col-span-1 md:col-span-2">
        <Brick color="yellow">
          <h2 className="text-3xl font-cartoon mb-3 text-yellow-900 drop-shadow-sm">🤖 乐高小管家</h2>
          <p className="text-xl leading-relaxed text-yellow-950 font-ui font-medium bg-white/30 p-4 rounded-2xl border-2 border-yellow-400/30">
            {inspiration}
          </p>
        </Brick>
      </div>
      
      <Brick color="red" onClick={() => setActiveSection('learning')}>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-7xl mb-4 transform group-hover:rotate-12 transition-transform drop-shadow-lg">📚</div>
          <h2 className="text-3xl font-cartoon text-white drop-shadow-md">学习基地</h2>
          <p className="mt-2 text-red-100 font-ui font-bold text-center text-sm">超级大脑，发射！</p>
        </div>
      </Brick>

      <Brick color="blue" onClick={() => setActiveSection('sports')}>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-7xl mb-4 transform group-hover:scale-110 transition-transform drop-shadow-lg">⚽</div>
          <h2 className="text-3xl font-cartoon text-white drop-shadow-md">体育中心</h2>
          <p className="mt-2 text-blue-100 font-ui font-bold text-center text-sm">活力无限，冲冲冲！</p>
        </div>
      </Brick>

      <Brick color="green" onClick={() => setActiveSection('entertainment')}>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-7xl mb-4 transform group-hover:-rotate-12 transition-transform drop-shadow-lg">🎮</div>
          <h2 className="text-3xl font-cartoon text-white drop-shadow-md">娱乐星球</h2>
          <p className="mt-2 text-green-100 font-ui font-bold text-center text-sm">打飞机游戏 & 创意挑战</p>
        </div>
      </Brick>

      <Brick color="black" onClick={() => setActiveSection('album')}>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-7xl mb-4 transform group-hover:scale-105 transition-transform drop-shadow-lg">📸</div>
          <h2 className="text-3xl font-cartoon text-white drop-shadow-md">家庭相册</h2>
          <p className="mt-2 text-gray-400 font-ui font-bold text-center text-sm">记录精彩时刻</p>
        </div>
      </Brick>

      <Brick color="white" onClick={() => setActiveSection('plan')}>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-7xl mb-4 drop-shadow-lg">📅</div>
          <h2 className="text-3xl font-cartoon text-gray-800">每日计划</h2>
          <p className="mt-2 text-gray-500 font-ui font-bold text-center text-sm">任务达成，耶！</p>
        </div>
      </Brick>
    </div>
  );

  const renderAlbum = () => (
    <div className="p-6">
      <div className="flex items-center justify-center gap-4 mb-10">
          <span className="text-5xl drop-shadow-lg">📸</span>
          <h2 className="text-5xl font-cartoon text-gray-800 drop-shadow-sm">Chuck的家庭相册</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
        <Brick color="white" className="overflow-hidden p-3 border-4 border-gray-100">
           <div className="bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
             <img src="Family Time at Beihai Park.png" alt="Family Time at Beihai Park" className="w-full h-64 object-cover" />
           </div>
           <p className="font-cartoon text-xl text-gray-800 mt-4 text-center italic">北海公园家庭时光 🏯</p>
        </Brick>

        <Brick color="white" className="overflow-hidden p-3 border-4 border-gray-100">
           <div className="bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
             <img src="At the School Gate.png" alt="At the School Gate" className="w-full h-64 object-cover" />
           </div>
           <p className="font-cartoon text-xl text-gray-800 mt-4 text-center italic">学校门口的美好时光 🏫</p>
        </Brick>

        <Brick color="white" className="overflow-hidden p-3 border-4 border-gray-100">
           <div className="bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
             <img src="Badminton Practice.png" alt="Badminton Practice" className="w-full h-64 object-cover" />
           </div>
           <p className="font-cartoon text-xl text-gray-800 mt-4 text-center italic">羽毛球练习时光 🏸</p>
        </Brick>
      </div>

      <div className="flex justify-center mt-12">
        <button onClick={() => setActiveSection('home')} className="bg-black text-white px-12 py-5 rounded-2xl font-cartoon text-2xl border-b-8 border-gray-800 hover:scale-110 active:scale-95 transition-all shadow-2xl">
          🚀 返回控制中心
        </button>
      </div>
    </div>
  );

  const renderLearning = () => {
    const content = {
      chinese: { title: "语文天地", list: ["《西游记》精读", "古诗词背诵挑战", "趣味汉字接龙"], color: "red" },
      english: { title: "English Fun", list: ["Phonics Practice", "Watching Pixar", "Daily Dialogue"], color: "blue" },
      math: { title: "数学实验室", list: ["乐高几何拼搭", "逻辑思维闯关", "九九乘法口诀"], color: "yellow" },
      science: { title: "科学大探索", list: ["自制火山爆发", "太阳系模型", "电路小能手"], color: "green" },
    };
    const current = content[activeSubject];
    return (
      <div className="p-6 space-y-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {(['chinese', 'english', 'math', 'science'] as Subject[]).map(s => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className={`px-8 py-3 rounded-2xl font-cartoon text-xl transition-all border-b-4 ${
                activeSubject === s 
                ? 'bg-black text-white scale-110 shadow-2xl translate-y-[-4px] border-gray-800' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {s === 'chinese' ? '语文' : s === 'english' ? '英语' : s === 'math' ? '数学' : '科学'}
            </button>
          ))}
        </div>
        <Brick color={current.color as any}>
          <h2 className="text-4xl font-cartoon mb-8 text-white drop-shadow-md">{current.title}</h2>
          <div className="grid grid-cols-1 gap-4">
            {current.list.map((item, idx) => (
              <div key={idx} className="bg-white/30 p-5 rounded-2xl flex items-center gap-5 border-2 border-white/20 hover:bg-white/40 transition-colors">
                <span className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-cartoon text-xl shadow-inner">{idx + 1}</span>
                <span className="text-2xl font-ui font-bold text-white drop-shadow-sm">{item}</span>
              </div>
            ))}
          </div>
        </Brick>
        <div className="flex justify-center pt-4">
            <button onClick={() => setActiveSection('home')} className="bg-[#05131D] text-white px-10 py-4 rounded-2xl font-cartoon text-2xl shadow-xl hover:scale-110 active:scale-95 border-b-8 border-black transition-all">🚀 返回主控台</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 max-w-5xl mx-auto pt-10 px-4 flex flex-col">
      <header className="flex flex-col items-center mb-16 relative">
        <div className="relative group">
            <div className="absolute -inset-4 bg-yellow-400 rounded-3xl -rotate-3 -z-10 shadow-lg border-b-8 border-yellow-600"></div>
            <div className="bg-[#C91A09] p-6 md:p-10 rounded-2xl shadow-2xl transform rotate-2 border-b-[12px] border-r-[8px] border-[#8B1306]">
              <div className="absolute -top-6 left-0 right-0 flex justify-around px-8">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="w-8 h-6 bg-[#C91A09] rounded-t-xl border-t border-x border-[#8B1306] shadow-inner"></div>)}
              </div>
              <h1 className="text-4xl md:text-7xl font-cartoon text-white tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">CHUCK'S WORLD</h1>
            </div>
        </div>
        <div className="mt-10 bg-white/80 backdrop-blur px-6 py-2 rounded-full border-2 border-white shadow-lg">
            <p className="text-gray-600 font-ui font-bold tracking-widest text-sm md:text-base">🧱 每一块积木都是一个小梦想 🧱</p>
        </div>
      </header>

      <main className="flex-grow animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeSection === 'home' && renderHome()}
        {activeSection === 'learning' && renderLearning()}
        {activeSection === 'album' && renderAlbum()}
        {activeSection === 'sports' && (
            <div className="p-6">
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className="text-5xl drop-shadow-lg">⚽</span>
                    <h2 className="text-5xl font-cartoon text-gray-800">体育中心</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <Brick color="blue">
                        <p className="font-cartoon text-white text-xl mb-2">今日步数</p>
                        <p className="font-cartoon text-white text-6xl">8,420</p>
                    </Brick>
                    <Brick color="yellow">
                        <p className="font-cartoon text-yellow-900 text-xl mb-2">消耗能量</p>
                        <p className="font-cartoon text-yellow-900 text-6xl">320 kcal</p>
                    </Brick>
                </div>
                <button onClick={() => setActiveSection('home')} className="mx-auto block bg-black text-white px-10 py-4 rounded-2xl font-cartoon text-2xl border-b-8 border-gray-800 transition-all active:translate-y-2">返回</button>
            </div>
        )}
        {activeSection === 'entertainment' && (
            <div className="p-6">
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className="text-5xl drop-shadow-lg">🎮</span>
                    <h2 className="text-5xl font-cartoon text-gray-800">娱乐星球</h2>
                </div>
                
                <div className="max-w-md mx-auto mb-10">
                    <div className="bg-yellow-400 p-4 rounded-t-3xl border-x-4 border-t-4 border-yellow-600 flex justify-between items-center">
                        <span className="font-cartoon text-xl text-yellow-900">最高得分</span>
                        <span className="font-cartoon text-3xl text-yellow-900">{highScore}</span>
                    </div>
                    <StarAceGame onGameOver={handleGameOver} />
                </div>

                <Brick color="green" className="mb-10">
                    <p className="text-2xl font-ui font-bold text-white mb-4">✨ 创意挑战：</p>
                    <div className="bg-white/20 p-8 rounded-3xl border-4 border-dashed border-white/40">
                        <p className="text-3xl font-cartoon text-white text-center">拼出一个“会飞”的潜水艇！</p>
                    </div>
                </Brick>
                
                <button onClick={() => setActiveSection('home')} className="mx-auto block bg-black text-white px-10 py-4 rounded-2xl font-cartoon text-2xl border-b-8 border-gray-800 transition-all active:translate-y-2">返回控制台</button>
            </div>
        )}
        {activeSection === 'plan' && (
            <div className="p-6">
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className="text-5xl drop-shadow-lg">📋</span>
                    <h2 className="text-5xl font-cartoon text-gray-800">任务清单</h2>
                </div>
                <Brick color="white">
                    <div className="space-y-4">
                        {tasks.map(task => (
                        <div key={task.id} onClick={() => toggleTask(task.id)} className={`flex items-center gap-5 p-6 rounded-2xl cursor-pointer transition-all border-b-4 ${task.completed ? 'bg-green-100 border-green-300 opacity-70' : 'bg-gray-50 border-gray-200 hover:scale-[1.02]'}`}>
                            <div className={`w-10 h-10 rounded-xl border-4 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-700' : 'bg-white border-gray-300'}`}>
                                {task.completed && <span className="text-white text-xl">✔</span>}
                            </div>
                            <div className="flex-1">
                                <p className={`text-2xl font-ui font-bold ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>{task.text}</p>
                                <span className="text-base text-gray-400 font-cartoon">{task.time}</span>
                            </div>
                        </div>
                        ))}
                    </div>
                </Brick>
                <button onClick={() => setActiveSection('home')} className="mt-12 mx-auto block bg-black text-white px-10 py-4 rounded-2xl font-cartoon text-2xl border-b-8 border-gray-800 transition-all active:translate-y-2">返回</button>
            </div>
        )}
      </main>

      <footer className="mt-20 flex flex-col items-center gap-4">
          <div className="flex gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 shadow-inner"></div>
              <div className="w-4 h-4 rounded-full bg-blue-500 shadow-inner"></div>
              <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-inner"></div>
              <div className="w-4 h-4 rounded-full bg-green-500 shadow-inner"></div>
          </div>
          <p className="text-gray-400 font-cartoon text-sm">© 2024 CHUCK LEGO WORLD • CLOUD SYNC READY</p>
      </footer>

      <nav className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-white/50 flex justify-around p-4 md:hidden z-50">
        <button onClick={() => setActiveSection('home')} className={`text-3xl p-2 rounded-xl ${activeSection === 'home' ? 'bg-yellow-400' : ''}`}>🏠</button>
        <button onClick={() => setActiveSection('learning')} className={`text-3xl p-2 rounded-xl ${activeSection === 'learning' ? 'bg-red-400' : ''}`}>📚</button>
        <button onClick={() => setActiveSection('sports')} className={`text-3xl p-2 rounded-xl ${activeSection === 'sports' ? 'bg-blue-400' : ''}`}>⚽</button>
        <button onClick={() => setActiveSection('album')} className={`text-3xl p-2 rounded-xl ${activeSection === 'album' ? 'bg-black text-white' : ''}`}>📸</button>
        <button onClick={() => setActiveSection('plan')} className={`text-3xl p-2 rounded-xl ${activeSection === 'plan' ? 'bg-green-400' : ''}`}>📋</button>
      </nav>
    </div>
  );
};

export default App;
