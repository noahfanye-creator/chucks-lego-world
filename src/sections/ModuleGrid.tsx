import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  BookOpen, Trophy, Gamepad2, Camera, Calendar,
  CheckCircle2, Circle, Plus, ChevronRight, Star, Trash2, Pencil
} from 'lucide-react';
import { useParentAuth } from '@/contexts/ParentAuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

gsap.registerPlugin(ScrollTrigger);

const GALLERY_STORAGE_KEY = 'chuck_gallery_photos';
const PLAN_STORAGE_KEY = 'chuck_daily_plan';

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
    setHomework(homework.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
        <div>
          <h3 className="font-fredoka text-xl font-bold text-white">学习基地</h3>
          <p className="font-nunito text-white/80 text-sm">超级大脑，发射！</p>
        </div>
      </div>
      <div className="space-y-3 mb-4 flex-1">
        {subjects.map((s, i) => (
          <div key={i} className="bg-white/20 rounded-lg p-2">
            <div className="flex justify-between text-white text-sm mb-1"><span>{s.name}</span><span>{s.progress}%</span></div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div className={`h-full ${s.color} rounded-full transition-all duration-500`} style={{ width: `${s.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white/10 rounded-xl p-3">
        <p className="text-white/80 text-sm mb-2 font-semibold">今日作业</p>
        <div className="space-y-2">
          {homework.map(h => (
            <div key={h.id} onClick={() => toggleHomework(h.id)} className="flex items-center gap-2 cursor-pointer">
              {h.done ? <CheckCircle2 className="w-4 h-4 text-lego-green" /> : <Circle className="w-4 h-4 text-white/60" />}
              <span className={`text-sm ${h.done ? 'line-through text-white/50' : 'text-white'}`}>[{h.subject}] {h.task}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Trophy className="w-6 h-6 text-white" /></div>
        <div>
          <h3 className="font-fredoka text-xl font-bold text-white">体育中心</h3>
          <p className="font-nunito text-white/80 text-sm">活力无限，冲冲冲！</p>
        </div>
      </div>
      <div className="bg-white/20 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold">本周运动目标</span>
          <span className="text-white text-sm">{weeklyDone}/{weeklyGoal} 天</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: weeklyGoal }).map((_, i) => (
            <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-lg ${i < weeklyDone ? 'bg-lego-yellow' : 'bg-white/30'}`}>
              {i < weeklyDone ? '⭐' : ''}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3 flex-1">
        <p className="text-white/80 text-sm font-semibold">今日运动</p>
        {activities.map((a, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{a.icon} {a.name}</span>
              <span className={`text-sm ${a.current >= a.target ? 'text-lego-green' : 'text-white/70'}`}>{a.current}/{a.target} {a.unit}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${a.current >= a.target ? 'bg-lego-green' : 'bg-lego-yellow'}`}
                style={{ width: `${Math.min((a.current / a.target) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Gamepad2 className="w-6 h-6 text-white" /></div>
        <div>
          <h3 className="font-fredoka text-xl font-bold text-white">娱乐星球</h3>
          <p className="font-nunito text-white/80 text-sm">打飞机游戏 & 创意挑战</p>
        </div>
      </div>
      <div className="bg-white/20 rounded-xl p-4 mb-4 text-center">
        <p className="text-white/80 text-sm mb-1">太空射击最高分</p>
        <p className="font-pixel text-3xl text-lego-yellow">{highScore}</p>
      </div>
      <div className="space-y-2 flex-1">
        {games.map((g, i) => (
          <a key={i} href="#game" className="flex items-center justify-between bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors">
            <div><p className="text-white font-medium">{g.name}</p><p className="text-white/60 text-sm">玩过 {g.plays} 次</p></div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-lego-yellow" /><span className="text-white text-sm">{g.best}</span><ChevronRight className="w-4 h-4 text-white/60" /></div>
          </a>
        ))}
      </div>
      <a href="#game" className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-fredoka font-semibold py-3 rounded-xl text-center transition-colors">开始游戏</a>
    </div>
  );
};

type GalleryPhoto = { id: string; src: string; title: string; date: string };
const EMOJI_PLACEHOLDERS: { emoji: string; title: string; date: string }[] = [
  { emoji: '🎂', title: '生日派对', date: '2024-01-15' },
  { emoji: '🏖️', title: '海边度假', date: '2024-01-08' },
  { emoji: '🎄', title: '圣诞节', date: '2023-12-25' },
  { emoji: '🎒', title: '开学第一天', date: '2023-09-01' },
];
const DEFAULT_PHOTOS: GalleryPhoto[] = EMOJI_PLACEHOLDERS.map(({ emoji, title, date }, i) => ({
  id: `default-${i + 1}`,
  src: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%23333" width="64" height="64" rx="8"/><text x="32" y="38" dominant-baseline="middle" text-anchor="middle" font-size="28">${encodeURIComponent(emoji)}</text></svg>`,
  title,
  date,
}));
function loadGallery(): GalleryPhoto[] {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw) as GalleryPhoto[]; if (Array.isArray(p) && p.length) return p; }
  } catch (_) {}
  return DEFAULT_PHOTOS;
}
function saveGallery(photos: GalleryPhoto[]) { localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(photos)); }

const GalleryModule = () => {
  const { isParent } = useParentAuth();
  const [photos, setPhotos] = useState<GalleryPhoto[]>(loadGallery);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { saveGallery(photos); }, [photos]);
  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setPhotos(prev => [...prev, { id: Date.now().toString(), src: reader.result as string, title: f.name.replace(/\.[^.]+$/, '') || '新照片', date }]);
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };
  const removePhoto = (id: string) => { setPhotos(prev => prev.filter(p => p.id !== id)); };
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Camera className="w-6 h-6 text-white" /></div>
        <div><h3 className="font-fredoka text-xl font-bold text-white">家庭相册</h3><p className="font-nunito text-white/80 text-sm">记录精彩时刻</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1 overflow-auto">
        {photos.map(photo => (
          <div key={photo.id} className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors group relative">
            <div className="aspect-square rounded-lg overflow-hidden bg-white/10 mb-2 flex items-center justify-center">
              <img src={photo.src} alt={photo.title} className="w-full h-full object-cover" />
            </div>
            <p className="text-white font-medium text-sm truncate">{photo.title}</p>
            <p className="text-white/60 text-xs">{photo.date}</p>
            {isParent && (
              <button type="button" onClick={() => removePhoto(photo.id)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity" title="删除">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={addPhoto} />
      {isParent ? (
        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-fredoka font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> 上传照片
        </button>
      ) : (
        <div className="mt-4 py-3 text-white/50 text-center text-sm font-nunito">家长登录后可上传照片</div>
      )}
    </div>
  );
};

type PlanItem = { id: number; time: string; activity: string; done: boolean };
const DEFAULT_PLANS: PlanItem[] = [
  { id: 1, time: '07:00', activity: '起床洗漱', done: true },
  { id: 2, time: '07:30', activity: '吃早餐', done: true },
  { id: 3, time: '08:00', activity: '上学', done: true },
  { id: 4, time: '16:00', activity: '做作业', done: false },
  { id: 5, time: '18:00', activity: '运动时间', done: false },
  { id: 6, time: '21:00', activity: '睡觉', done: false },
];
function loadPlan(): PlanItem[] {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw) as PlanItem[]; if (Array.isArray(p) && p.length) return p; }
  } catch (_) {}
  return DEFAULT_PLANS;
}
function savePlan(plans: PlanItem[]) { localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans)); }

const PlanModule = () => {
  const { isParent } = useParentAuth();
  const [plans, setPlans] = useState<PlanItem[]>(loadPlan);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [formTime, setFormTime] = useState('08:00');
  const [formActivity, setFormActivity] = useState('');
  useEffect(() => { savePlan(plans); }, [plans]);
  const togglePlan = (id: number) => { setPlans(prev => prev.map(p => (p.id === id ? { ...p, done: !p.done } : p))); };
  const openAdd = () => { setEditing(null); setFormTime('08:00'); setFormActivity(''); setEditOpen(true); };
  const openEdit = (p: PlanItem) => { setEditing(p); setFormTime(p.time); setFormActivity(p.activity); setEditOpen(true); };
  const submitPlan = () => {
    const t = formTime.trim();
    const a = formActivity.trim();
    if (!a) return;
    if (editing) setPlans(prev => prev.map(p => (p.id === editing.id ? { ...p, time: t, activity: a } : p)));
    else { const nextId = Math.max(0, ...plans.map(x => x.id)) + 1; setPlans(prev => [...prev, { id: nextId, time: t, activity: a, done: false }]); }
    setEditOpen(false);
  };
  const removePlan = (id: number) => { setPlans(prev => prev.filter(p => p.id !== id)); };
  const completedCount = plans.filter(p => p.done).length;
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-lego-black/20 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-lego-black" /></div>
        <div><h3 className="font-fredoka text-xl font-bold text-lego-black">每日计划</h3><p className="font-nunito text-lego-black/70 text-sm">任务达成，耶！</p></div>
      </div>
      <div className="bg-lego-yellow/30 rounded-xl p-3 mb-4">
        <div className="flex justify-between text-lego-black text-sm mb-2"><span className="font-semibold">今日完成度</span><span>{completedCount}/{plans.length}</span></div>
        <div className="h-3 bg-white rounded-full overflow-hidden">
          <div className="h-full bg-lego-green rounded-full transition-all duration-500" style={{ width: `${plans.length ? (completedCount / plans.length) * 100 : 0}%` }} />
        </div>
      </div>
      <div className="space-y-2 flex-1 overflow-auto">
        {plans.map(plan => (
          <div key={plan.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${plan.done ? 'bg-lego-green/20' : 'bg-lego-gray hover:bg-lego-gray-dark/20'}`}>
            <div className="flex-1 flex items-center gap-3 min-w-0" onClick={() => togglePlan(plan.id)} role="button">
              <span className={`font-mono font-bold text-sm shrink-0 ${plan.done ? 'text-lego-green' : 'text-lego-black/50'}`}>{plan.time}</span>
              <span className={`flex-1 font-nunito truncate ${plan.done ? 'line-through text-lego-black/50' : 'text-lego-black'}`}>{plan.activity}</span>
              {plan.done ? <CheckCircle2 className="w-5 h-5 text-lego-green shrink-0" /> : <Circle className="w-5 h-5 text-lego-black/30 shrink-0" />}
            </div>
            {isParent && (
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => openEdit(plan)} className="p-1.5 rounded-lg hover:bg-lego-yellow/50 text-lego-black/70" title="编辑"><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => removePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600" title="删除"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      {isParent && (
        <Button type="button" onClick={openAdd} variant="outline" className="mt-4 w-full font-fredoka border-lego-yellow text-lego-black hover:bg-lego-yellow/20">
          <Plus className="w-4 h-4" /> 添加计划
        </Button>
      )}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent showCloseButton className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-fredoka">{editing ? '编辑计划' : '添加计划'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-2 block">时间</label><Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-2 block">内容</label><Input placeholder="例如：做作业" value={formActivity} onChange={e => setFormActivity(e.target.value)} /></div>
            <Button onClick={submitPlan} className="w-full font-fredoka" disabled={!formActivity.trim()}>{editing ? '保存' : '添加'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ModuleGrid = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('.module-card');
      if (cards) cards.forEach((card, i) => {
        gsap.fromTo(card, { y: 80, opacity: 0, rotationX: 20 }, {
          y: 0, opacity: 1, rotationX: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });
    }, gridRef);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={gridRef} className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-fredoka text-3xl sm:text-4xl font-bold text-lego-black text-center mb-8">创意乐园</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
          <div id="study" className="module-card lego-brick-red rounded-lego p-5 min-h-[360px]"><StudyModule /></div>
          <div id="sports" className="module-card lego-brick-blue rounded-lego p-5 min-h-[360px]"><SportsModule /></div>
          <div id="game" className="module-card lego-brick-green rounded-lego p-5 min-h-[360px]"><GameModule /></div>
          <div id="gallery" className="module-card lego-brick-black rounded-lego p-5 min-h-[360px]"><GalleryModule /></div>
          <div id="plan" className="module-card lego-brick-white rounded-lego p-5 min-h-[360px] md:col-span-2 lg:col-span-1"><PlanModule /></div>
        </div>
      </div>
    </section>
  );
};

export default ModuleGrid;
