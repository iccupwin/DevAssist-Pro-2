import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, X, UserCheck } from "lucide-react"

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export interface RegistrationToastProps {
  isVisible: boolean
  onClose: () => void
  userName?: string
  email?: string
  duration?: number
}

const RegistrationToast: React.FC<RegistrationToastProps> = ({
  isVisible,
  onClose,
  userName = "Пользователь",
  email = "user@example.com",
  duration = 5000
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  // Диагностика
  console.log('RegistrationToast rendered', { isVisible, userName, email });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 1,
          }}
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center",
            "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
            "p-4"
          )}
        >
        <div className={cn(
          "max-w-md w-full bg-background border border-emerald-500/50",
          "rounded-xl shadow-lg shadow-black/10",
          "dark:shadow-black/20 p-6"
        )}>
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full border border-emerald-500/20"
            >
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            
            <div className="flex-1 space-y-1">
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-semibold text-emerald-600 dark:text-emerald-400"
              >
                Регистрация успешна!
              </motion.h3>
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1"
              >
                <p className="text-sm text-foreground">
                  Добро пожаловать, <span className="font-medium">{userName}</span>!
                </p>
                <p className="text-xs text-muted-foreground">
                  Письмо с подтверждением отправлено на {email}
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-muted-foreground">
                  Аккаунт активирован
                </span>
              </motion.div>
            </div>
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onClose}
              className={cn(
                "rounded-full p-1.5 hover:bg-muted/50 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
              aria-label="Закрыть уведомление"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </motion.button>
          </div>
          
          {/* Progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 rounded-b-xl overflow-hidden"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          >
            <div className="h-full bg-emerald-500" />
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default RegistrationToast; 