import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './sections/Hero';
import LegoButler from './sections/LegoButler';
import ModuleGrid from './sections/ModuleGrid';
import SpaceShooterGame from './sections/SpaceShooterGame';
import Footer from './sections/Footer';
import './App.css';

// 注册GSAP插件
gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    // 初始化平滑滚动
    const initSmoothScroll = () => {
      document.documentElement.style.scrollBehavior = 'smooth';
    };
    initSmoothScroll();

    // 页面加载完成后的入场动画
    const ctx = gsap.context(() => {
      gsap.fromTo('body',
        { opacity: 0 },
        { opacity: 1, duration: 0.5 }
      );
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-lego-gray">
      {/* Hero区域 */}
      <Hero />
      
      {/* 乐高小管家 */}
      <LegoButler />
      
      {/* 功能模块网格 */}
      <ModuleGrid />
      
      {/* 太空射击游戏 */}
      <SpaceShooterGame />
      
      {/* 页脚 */}
      <Footer />
    </div>
  );
}

export default App;
