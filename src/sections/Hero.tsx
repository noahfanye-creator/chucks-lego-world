import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Box, Rocket, Gamepad2, BookOpen, Trophy, Camera, Calendar, FileText } from 'lucide-react';

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 标题积木掉落动画
      const titleChars = titleRef.current?.querySelectorAll('.title-char');
      if (titleChars) {
        gsap.fromTo(titleChars, 
          { 
            y: -300, 
            rotation: () => gsap.utils.random(-45, 45),
            opacity: 0 
          },
          { 
            y: 0, 
            rotation: 0, 
            opacity: 1, 
            duration: 1.2, 
            stagger: 0.08,
            ease: 'bounce.out',
            delay: 0.2
          }
        );
      }

      // 副标题打字机效果
      if (subtitleRef.current) {
        gsap.fromTo(subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, delay: 1.5, ease: 'power2.out' }
        );
      }

      // 导航卡片飞入动画
      const cards = cardsRef.current?.querySelectorAll('.nav-card');
      if (cards) {
        gsap.fromTo(cards,
          { 
            scale: 0, 
            rotation: 180,
            opacity: 0 
          },
          { 
            scale: 1, 
            rotation: 0, 
            opacity: 1, 
            duration: 0.8, 
            stagger: 0.1,
            ease: 'back.out(1.7)',
            delay: 1
          }
        );
      }

      // 持续悬浮动画
      const floatingElements = containerRef.current?.querySelectorAll('.float-element');
      floatingElements?.forEach((el, i) => {
        gsap.to(el, {
          y: '+=10',
          duration: 2 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 鼠标移动3D倾斜效果
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      gsap.to(container.querySelector('.hero-content'), {
        rotationY: x * 5,
        rotationX: -y * 5,
        duration: 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(container.querySelector('.hero-content'), {
        rotationY: 0,
        rotationX: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const titleText = "CHUCK'S WORLD";

  const navItems = [
    { icon: BookOpen, label: '学习', color: 'lego-brick-red', href: '#study', external: false },
    { icon: Trophy, label: '运动', color: 'lego-brick-blue', href: '#sports', external: false },
    { icon: Gamepad2, label: '游戏', color: 'lego-brick-green', href: '#game', external: false },
    { icon: Camera, label: '相册', color: 'lego-brick-black', href: '#gallery', external: false },
    { icon: Calendar, label: '计划', color: 'lego-brick-yellow', href: '#plan', external: false },
    { icon: FileText, label: '报告', color: 'lego-brick-blue', href: '/reports', external: true },
  ];

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden perspective-1000 py-20"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 dot-pattern opacity-20" />
      
      {/* 浮动装饰元素 */}
      <div className="absolute top-20 left-10 float-element opacity-30">
        <Box className="w-16 h-16 text-lego-red" />
      </div>
      <div className="absolute top-40 right-20 float-element opacity-30">
        <Rocket className="w-12 h-12 text-lego-yellow" />
      </div>
      <div className="absolute bottom-32 left-20 float-element opacity-30">
        <Gamepad2 className="w-14 h-14 text-lego-blue" />
      </div>
      <div className="absolute bottom-20 right-10 float-element opacity-30">
        <Box className="w-10 h-10 text-lego-green" />
      </div>

      <div className="hero-content preserve-3d relative z-10 w-full max-w-6xl mx-auto px-4">
        {/* 主标题 */}
        <div className="text-center mb-8">
          <h1 
            ref={titleRef}
            className="font-fredoka font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-lego-red title-3d tracking-wide inline-flex flex-wrap justify-center gap-1"
          >
            {titleText.split('').map((char, i) => (
              <span 
                key={i} 
                className="title-char inline-block"
                style={{ 
                  textShadow: '0 4px 0 #B71C1C, 0 8px 0 rgba(0,0,0,0.2)',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
          
          <p 
            ref={subtitleRef}
            className="mt-6 font-nunito text-lg sm:text-xl text-lego-black/70 flex items-center justify-center gap-3"
          >
            <Box className="w-5 h-5 text-lego-red" />
            <span>每一块积木都是一个小梦想</span>
            <Box className="w-5 h-5 text-lego-red" />
          </p>
        </div>

        {/* 导航卡片 */}
        <div 
          ref={cardsRef}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          {navItems.map((item, index) =>
            item.external ? (
              <Link
                key={index}
                to={item.href}
                className={`nav-card float-element ${item.color} px-6 py-4 rounded-lego font-fredoka font-semibold text-sm sm:text-base flex items-center gap-3 transition-all duration-300 hover:scale-105`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ) : (
              <a
                key={index}
                href={item.href}
                className={`nav-card float-element ${item.color} px-6 py-4 rounded-lego font-fredoka font-semibold text-sm sm:text-base flex items-center gap-3 transition-all duration-300 hover:scale-105`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            )
          )}
        </div>

        {/* 欢迎语 */}
        <div className="mt-16 text-center">
          <div className="inline-block lego-brick-yellow px-8 py-4 rounded-lego">
            <p className="font-nunito text-lego-black font-semibold text-lg">
              🤖 嘿 Chuck！准备好开始今天的冒险了吗？
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
