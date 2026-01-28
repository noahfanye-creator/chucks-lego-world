import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Box, Heart, Cloud } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(footerRef.current,
        { y: -50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'bounce.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 95%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer 
      ref={footerRef}
      className="relative mt-12"
    >
      {/* 绿色基板效果 */}
      <div className="bg-lego-green relative overflow-hidden">
        {/* 乐高钉装饰 */}
        <div className="absolute top-0 left-0 right-0 h-4 flex justify-around">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i}
              className="w-8 h-4 bg-lego-green rounded-t-full"
              style={{ 
                boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.3)',
                background: 'linear-gradient(to bottom, #4CAF50, #388E3C)'
              }}
            />
          ))}
        </div>

        {/* 底部阴影 */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{ boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)' }}
        />

        <div className="max-w-6xl mx-auto px-4 py-8 pt-10">
          {/* 主要内容 */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo区域 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Box className="w-7 h-7 text-lego-red" />
              </div>
              <div>
                <h3 className="font-fredoka text-xl font-bold text-white">
                  CHUCK'S WORLD
                </h3>
                <p className="font-nunito text-white/70 text-sm">
                  每一块积木都是梦想
                </p>
              </div>
            </div>

            {/* 状态指示 */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <Cloud className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-nunito">云端同步就绪</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-lego-green rounded-full animate-pulse" 
                     style={{ boxShadow: '0 0 10px #4ade80' }} />
                <span className="text-white/80 text-sm font-nunito">系统正常</span>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="my-6 h-px bg-white/20" />

          {/* 版权信息 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-white/70 text-sm font-nunito flex items-center gap-1">
              © 2024 CHUCK LEGO WORLD • 用
              <Heart className="w-4 h-4 text-lego-red inline fill-lego-red" />
              搭建
            </p>
            <div className="flex items-center gap-4">
              <span className="text-white/50 text-xs font-nunito">v2.0.0</span>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-lego-red rounded-md" />
                <div className="w-6 h-6 bg-lego-yellow rounded-md" />
                <div className="w-6 h-6 bg-lego-blue rounded-md" />
                <div className="w-6 h-6 bg-white rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰条 */}
      <div className="h-2 bg-gradient-to-r from-lego-red via-lego-yellow to-lego-blue" />
    </footer>
  );
};

export default Footer;
