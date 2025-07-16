import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  animation?: 'bounce' | 'scale' | 'glow' | 'ripple' | 'slide';
  haptic?: boolean;
}

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Интерактивная кнопка с микро-анимациями
 */
export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  animation = 'scale',
  haptic = false,
  onClick,
  disabled,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const baseClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const animations = {
    bounce: {
      whileHover: { scale: 1.05, y: -2 },
      whileTap: { scale: 0.95, y: 0 },
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    scale: {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    glow: {
      whileHover: { 
        scale: 1.02,
        boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)"
      },
      whileTap: { scale: 0.98 },
      transition: { duration: 0.2 }
    },
    slide: {
      whileHover: { x: 2 },
      whileTap: { x: 0 },
      transition: { type: "spring", stiffness: 300 }
    },
    ripple: {
      whileHover: { scale: 1.01 },
      whileTap: { scale: 0.99 }
    }
  };

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Haptic feedback для мобильных устройств
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Ripple эффект
    if (animation === 'ripple' && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = { id: Date.now(), x, y };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    onClick?.(e);
  }, [disabled, haptic, animation, onClick]);

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        baseClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      {...animations[animation]}
      {...props}
    >
      {/* Ripple эффект */}
      {animation === 'ripple' && (
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {ripples.map(ripple => (
              <motion.div
                key={ripple.id}
                className="absolute bg-white/20 rounded-full"
                style={{
                  left: ripple.x - 10,
                  top: ripple.y - 10,
                  width: 20,
                  height: 20
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {children}
    </motion.button>
  );
};

/**
 * Hover карточка с анимированным контентом
 */
export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  content,
  side = 'top',
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: { bottom: '100%', left: '50%', x: '-50%', y: '-8px' },
    bottom: { top: '100%', left: '50%', x: '-50%', y: '8px' },
    left: { right: '100%', top: '50%', x: '-8px', y: '-50%' },
    right: { left: '100%', top: '50%', x: '8px', y: '-50%' }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setTimeout(() => setIsVisible(true), delay)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
            style={positions[side]}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {content}
            
            {/* Стрелка */}
            <div 
              className={cn(
                "absolute w-2 h-2 bg-gray-900 transform rotate-45",
                side === 'top' && "bottom-[-4px] left-1/2 -translate-x-1/2",
                side === 'bottom' && "top-[-4px] left-1/2 -translate-x-1/2",
                side === 'left' && "right-[-4px] top-1/2 -translate-y-1/2",
                side === 'right' && "left-[-4px] top-1/2 -translate-y-1/2"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Плавающий лейбл для полей ввода
 */
export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  error,
  className,
  value,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  const isFloating = isFocused || hasValue;

  return (
    <div className="relative">
      <motion.input
        className={cn(
          'w-full px-3 pt-6 pb-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          className
        )}
        value={value}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          onChange?.(e);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        {...props}
      />
      
      <motion.label
        className={cn(
          'absolute left-3 pointer-events-none transition-colors',
          error ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-500'
        )}
        animate={{
          y: isFloating ? -8 : 8,
          fontSize: isFloating ? '12px' : '16px',
          fontWeight: isFloating ? 500 : 400
        }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>
      
      {error && (
        <motion.p
          className="mt-1 text-sm text-red-500"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

/**
 * Анимированный счетчик
 */
export const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}> = ({ value, duration = 1, suffix = '', className }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  React.useEffect(() => {
    const animation = count.set(value);
  }, [value, count]);

  return (
    <motion.span 
      className={className}
      animate={{ 
        scale: [1, 1.1, 1],
        color: ['#374151', '#3b82f6', '#374151']
      }}
      transition={{ duration: 0.5 }}
    >
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
};

/**
 * Индикатор прогресса с анимацией
 */
export const AnimatedProgress: React.FC<{
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'orange';
  showPercentage?: boolean;
  animated?: boolean;
}> = ({ 
  value, 
  max = 100, 
  size = 'md', 
  color = 'blue', 
  showPercentage = false, 
  animated = true 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="w-full">
      <div className={cn('bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          className={cn('h-full rounded-full', colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: animated ? 0.8 : 0, 
            ease: "easeOut" 
          }}
        />
      </div>
      
      {showPercentage && (
        <div className="mt-1 text-right">
          <AnimatedCounter 
            value={percentage} 
            suffix="%" 
            className="text-sm text-gray-600"
          />
        </div>
      )}
    </div>
  );
};

/**
 * Магнитная кнопка (следует за курсором)
 */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}> = ({ children, strength = 0.3, className, onClick }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    
    x.set(deltaX);
    y.set(deltaY);
  }, [strength, x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      className={cn('transition-transform', className)}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
    >
      {children}
    </motion.button>
  );
};

export default {
  InteractiveButton,
  HoverCard,
  FloatingLabelInput,
  AnimatedCounter,
  AnimatedProgress,
  MagneticButton
};