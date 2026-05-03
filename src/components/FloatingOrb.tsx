import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FloatingOrbProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}

export function FloatingOrb({ children, delay = 0, duration = 4, yOffset = -12, className = '' }: FloatingOrbProps) {
  return (
    <motion.div
      animate={{ y: [0, yOffset, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
