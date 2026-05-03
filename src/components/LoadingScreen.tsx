import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Database, Cpu, BarChart3, CheckCircle2 } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const STEPS = [
  { icon: Database, text: 'Loading dataset from KaggleHub...', duration: 800 },
  { icon: Zap, text: 'Standardizing features with StandardScaler...', duration: 700 },
  { icon: Database, text: 'Applying SMOTE oversampling...', duration: 900 },
  { icon: Cpu, text: 'Training K-Nearest Neighbors (k=5)...', duration: 1100 },
  { icon: Cpu, text: 'Training Random Forest (100 estimators)...', duration: 1200 },
  { icon: BarChart3, text: 'Computing ROC-AUC and PR curves...', duration: 600 },
  { icon: CheckCircle2, text: 'Platform ready. Welcome back.', duration: 500 },
];

function ParticleBurst({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }[]>([]);
  const rafRef = useRef<number>(0);

  const spawn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#1e40af', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 3;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        size: 1 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '');
        // hex to rgba
        const hex = p.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    if (active) spawn();
  }, [active, spawn]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}

function TypingText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <span className="font-mono text-xs sm:text-sm text-blue-300/80">
      {displayed}
      <span className={`inline-block w-2 h-4 sm:h-5 bg-blue-400 ml-0.5 align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
    </span>
  );
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [burstActive, setBurstActive] = useState(false);

  useEffect(() => {
    let currentStep = 0;
    const totalDuration = STEPS.reduce((a, s) => a + s.duration, 0);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Determine current step
      let stepTime = 0;
      for (let i = 0; i < STEPS.length; i++) {
        stepTime += STEPS[i].duration;
        if (elapsed <= stepTime) {
          if (currentStep !== i) {
            currentStep = i;
            setStepIndex(i);
            setBurstActive(true);
            setTimeout(() => setBurstActive(false), 100);
          }
          break;
        }
      }

      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowContent(false);
          setTimeout(onComplete, 600);
        }, 400);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  const currentStep = STEPS[stepIndex];
  const StepIcon = currentStep?.icon || Shield;

  return (
    <AnimatePresence>
      {showContent && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[300] overflow-hidden"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/images/loading-bg.jpg"
              alt=""
              className="w-full h-full object-cover scale-110"
              style={{ animation: 'slowZoom 20s ease-in-out infinite alternate' }}
            />
            <div className="absolute inset-0 bg-slate-950/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60" />
          </div>

          {/* Animated grid overlay */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
                animation: 'gridMove 3s linear infinite',
              }}
            />
          </div>

          {/* Particle burst */}
          <ParticleBurst active={burstActive} />

          {/* Main content */}
          <div className="relative z-20 flex flex-col items-center justify-center h-full px-6">
            {/* 3D Logo Card */}
            <motion.div
              initial={{ opacity: 0, rotateX: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1 }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
              className="perspective-1000 mb-10"
            >
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="preserve-3d"
              >
                <div className="relative">
                  {/* Glow ring */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-6 rounded-3xl bg-blue-500/20 blur-2xl"
                  />
                  <motion.div
                    animate={{ scale: [1.1, 1.3, 1.1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute -inset-10 rounded-3xl bg-indigo-500/10 blur-3xl"
                  />

                  {/* Logo */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-400/20">
                    <Shield size={48} className="text-white sm:w-16 sm:h-16" strokeWidth={1.5} />
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden">
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                        className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-2">
                Sentinel
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300"> AI</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm tracking-widest uppercase font-medium">
                Fraud Detection Platform
              </p>
            </motion.div>

            {/* Status with typing effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-3 mb-8 min-h-[28px]"
            >
              <motion.div
                key={stepIndex}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <StepIcon size={14} className="text-blue-400 sm:w-4 sm:h-4" />
              </motion.div>
              <TypingText key={stepIndex} text={currentStep?.text || ''} speed={25} />
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-full max-w-md mb-4"
            >
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-2 font-mono">
                <span>INITIALIZING</span>
                <span className="text-blue-400">{progress.toFixed(0)}%</span>
              </div>
              <div className="relative h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden">
                {/* Track glow */}
                <div className="absolute inset-0 rounded-full bg-blue-500/10" />
                {/* Fill */}
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"
                  style={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                >
                  {/* Leading glow */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-4 bg-blue-400/50 blur-md rounded-full" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg shadow-blue-400" />
                </motion.div>
              </div>
            </motion.div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              {STEPS.map((_step, i) => {
                const isActive = i === stepIndex;
                const isDone = i < stepIndex;
                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      backgroundColor: isDone ? 'rgb(16, 185, 129)' : isActive ? 'rgb(59, 130, 246)' : 'rgb(30, 41, 59)',
                    }}
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-full h-full rounded-full bg-blue-400"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-slate-600 font-mono"
            >
              <span>v1.0.0</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>284,807 rows</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>30 features</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>2 models</span>
            </motion.div>
          </div>

          {/* CSS animations */}
          <style>{`
            @keyframes slowZoom {
              from { transform: scale(1.1); }
              to { transform: scale(1.2); }
            }
            @keyframes gridMove {
              from { transform: translateY(0); }
              to { transform: translateY(60px); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
