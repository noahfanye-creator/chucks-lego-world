import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '../sections/Hero';
import LegoButler from '../sections/LegoButler';
import ModuleGrid from '../sections/ModuleGrid';
import SpaceShooterGame from '../sections/SpaceShooterGame';
import Footer from '../sections/Footer';
import ParentLoginModal from '../components/ParentLoginModal';

function Home() {
  useEffect(() => {
    const initSmoothScroll = () => {
      document.documentElement.style.scrollBehavior = 'smooth';
    };
    initSmoothScroll();

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
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4 text-sm">
          <Link
            to="/"
            className="font-semibold text-slate-900"
          >
            首页
          </Link>
          <a href="#pre-market" className="text-slate-600 hover:text-slate-900">
            盘前
          </a>
          <a href="#in-market" className="text-slate-600 hover:text-slate-900">
            盘中
          </a>
          <a href="#after-market" className="text-slate-600 hover:text-slate-900">
            盘后
          </a>
          <a href="#archive" className="text-slate-600 hover:text-slate-900">
            归档
          </a>
          <Link
            to="/reports"
            className="text-slate-600 hover:text-slate-900"
          >
            报告
          </Link>
          <a href="#about" className="ml-auto text-slate-600 hover:text-slate-900">
            关于
          </a>
        </nav>
      </header>

      <Hero />
      <LegoButler />
      <ModuleGrid />
      <SpaceShooterGame />
      <Footer />
      <ParentLoginModal />
    </div>
  );
}

export default Home;
