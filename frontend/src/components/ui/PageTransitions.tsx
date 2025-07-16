import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'rotate' | 'custom';
  duration?: number;
  className?: string;
}

interface StaggerContainerProps {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}

interface RevealTextProps {
  text: string;
  delay?: number;
  className?: string;
}

// Предустановленные анимации страниц
const pageVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  },
  rotate: {
    initial: { rotateY: -90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: 90, opacity: 0 }
  }
};

/**
 * Анимированные переходы между страницами
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'fade',
  duration = 0.3,
  className
}) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className={className}
        variants={pageVariants[type]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ 
          duration, 
          ease: [0.22, 1, 0.36, 1] // Кастомная ease функция
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Контейнер с анимацией появления элементов по очереди
 */
export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  stagger = 0.1,
  className
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Анимированное появление текста по словам
 */
export const RevealText: React.FC<RevealTextProps> = ({
  text,
  delay = 0,
  className
}) => {
  const words = text.split(' ');

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay
      }
    }
  };

  const wordVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 50,
      rotateX: -90
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-2"
          variants={wordVariants}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

/**
 * Морфинг фигур (для декоративных элементов)
 */
export const MorphingShape: React.FC<{
  shapes: string[];
  duration?: number;
  className?: string;
}> = ({ shapes, duration = 2, className }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shapes.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [shapes.length, duration]);

  return (
    <motion.div className={className}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <motion.path
          d={shapes[currentIndex]}
          fill="currentColor"
          animate={{ d: shapes[currentIndex] }}
          transition={{ duration: duration, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
};

/**
 * Parallax скролл эффект
 */
export const ParallaxContainer: React.FC<{
  children: React.ReactNode;
  speed?: number;
  className?: string;
}> = ({ children, speed = 0.5, className }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const parallax = scrolled * speed;
      
      setOffset(parallax);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${offset}px)`
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Floating элементы (для декора)
 */
export const FloatingElements: React.FC<{
  count?: number;
  size?: number;
  className?: string;
}> = ({ count = 5, size = 10, className }) => {
  const elements = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className={`absolute bg-blue-500/20 rounded-full pointer-events-none`}
      style={{
        width: size + Math.random() * size,
        height: size + Math.random() * size,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, Math.random() * 20 - 10, 0],
        rotate: [0, 360],
        scale: [1, 1.2, 1]
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 2
      }}
    />
  ));

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {elements}
    </div>
  );
};

/**
 * Анимированная граница (для карточек)
 */
export const AnimatedBorder: React.FC<{
  children: React.ReactNode;
  gradient?: string;
  speed?: number;
  className?: string;
}> = ({ 
  children, 
  gradient = 'from-blue-500 via-purple-500 to-pink-500',
  speed = 2,
  className 
}) => {
  return (
    <div className={`relative p-1 rounded-lg ${className}`}>
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-lg`}
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          background: `conic-gradient(from 0deg, var(--tw-gradient-stops))`
        }}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg p-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Typing эффект для текста
 */
export const TypingText: React.FC<{
  text: string;
  speed?: number;
  cursor?: boolean;
  className?: string;
  onComplete?: () => void;
}> = ({ text, speed = 50, cursor = true, className, onComplete }) => {
  const [displayText, setDisplayText] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(true);
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  React.useEffect(() => {
    if (isComplete && cursor) {
      const cursorTimer = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
      return () => clearInterval(cursorTimer);
    }
  }, [isComplete, cursor]);

  return (
    <span className={className}>
      {displayText}
      {cursor && showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        >
          |
        </motion.span>
      )}
    </span>
  );
};

export default {
  PageTransition,
  StaggerContainer,
  RevealText,
  MorphingShape,
  ParallaxContainer,
  FloatingElements,
  AnimatedBorder,
  TypingText
};