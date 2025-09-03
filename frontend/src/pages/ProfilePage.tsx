import React from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Key, LogOut, Settings, CheckCircle, Clock, XCircle, Edit2, Save, X, Bell, Lock, Palette, Globe } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// TypeScript interfaces for components
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className = '', variant = 'default', size = 'default', ...props }, ref) {
  const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50";
  const variantClasses = {
    default: "bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground shadow-sm shadow-black/5 hover:bg-destructive/90",
    outline: "border border-input bg-background shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground shadow-sm shadow-black/5 hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-lg px-3 text-xs",
    lg: "h-10 rounded-lg px-8",
    icon: "h-9 w-9",
  };
  return (
    <button ref={ref} className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)} {...props} />
  );
});

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(function Avatar({ className = '', size = 'md', ...props }, ref) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };
  return (
    <div ref={ref} className={cn("relative flex shrink-0 overflow-hidden rounded-full", sizeClasses[size], className)} {...props} />
  );
});
const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(function AvatarImage({ className = '', ...props }, ref) {
  return <img ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />;
});
const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(function AvatarFallback({ className = '', children, ...props }, ref) {
  return <div ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium", className)} {...props}>{children}</div>;
});
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(function Badge({ className = '', variant = 'default', ...props }, ref) {
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
    outline: "text-foreground",
    success: "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80",
    warning: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80",
  };
  return (
    <div ref={ref} className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variantClasses[variant], className)} {...props} />
  );
});
const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className }) => {
  const statusConfig = {
    online: { color: "bg-green-500", icon: CheckCircle, label: "В сети" },
    offline: { color: "bg-gray-400", icon: XCircle, label: "Не в сети" },
    busy: { color: "bg-red-500", icon: XCircle, label: "Занят" },
    away: { color: "bg-yellow-500", icon: Clock, label: "Отошел" },
  };
  const config = statusConfig[status] || statusConfig['offline'];
  const Icon = config.icon;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("h-2 w-2 rounded-full", config.color)} />
      <span className="text-sm text-muted-foreground">{config.label}</span>
    </div>
  );
};
const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className = '', type, ...props }, ref) {
  return <input type={type} className={cn("flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />;
});
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ className = '', checked = false, onCheckedChange, ...props }, ref) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      ref={ref}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
});

const ProfilePage: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedUser, setEditedUser] = React.useState<any>(user);
  const [saving, setSaving] = React.useState(false);
  
  React.useEffect(() => {
    setEditedUser(user);
  }, [user]);
  
  if (!user) return null;
  
  const status = user.is_active ? 'online' : 'offline';
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: editedUser.full_name,
        email: editedUser.email,
        role: editedUser.role,
        // Добавьте другие поля, если нужно
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };
  const logoLight = '/devent-logo.png';
  const logoDark = '/devent-logo-white1.png';
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8">
      {/* Логотип и возврат на dashboard */}
      <div className="max-w-2xl mx-auto flex items-center mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 group focus:outline-none"
          aria-label="На главную"
        >
          <img
            src={isDarkMode ? logoDark : logoLight}
            alt="DevAssist Pro"
            className="w-10 h-10 rounded-lg shadow-md group-hover:scale-105 transition-transform"
          />
          <span className="text-lg font-bold text-gray-700 dark:text-white group-hover:text-blue-600 transition-colors">DevAssist Pro</span>
        </button>
      </div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">DevAssist Pro</h1>
          <p className="text-muted-foreground">Профиль пользователя</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
          <div className="relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="relative p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative">
                  <Avatar size="xl" className="ring-4 ring-white/50 dark:ring-slate-700/50">
                    {user.avatar ? <AvatarImage src={user.avatar} alt={user.full_name || user.email} /> : <AvatarFallback className="text-lg">{user.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : user.email?.charAt(0)?.toUpperCase()}</AvatarFallback>}
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <div className={cn("w-5 h-5 rounded-full border-3 border-white dark:border-slate-900", status === "online" && "bg-green-500", status === "offline" && "bg-gray-400")}/>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex-1 text-center md:text-left">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Имя</label>
                        <Input
                          value={editedUser.full_name || ''}
                          onChange={(e) => setEditedUser((prev: any) => ({ ...prev, full_name: e.target.value }))}
                          className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                        <Input
                          value={editedUser.email || ''}
                          onChange={(e) => setEditedUser((prev: any) => ({ ...prev, email: e.target.value }))}
                          className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Роль</label>
                        <Input
                          value={editedUser.role || ''}
                          onChange={(e) => setEditedUser((prev: any) => ({ ...prev, role: e.target.value }))}
                          className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{user.full_name || user.email}</h2>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          <span>{user.role}</span>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <StatusIndicator status={status} className="" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Badge variant="secondary" className="backdrop-blur-sm">
                          <User className="h-3 w-3 mr-1" />
                          Активный пользователь
                        </Badge>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={saving} className="backdrop-blur-sm transition-all duration-300 hover:scale-105">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 border-white/30 dark:border-slate-600/30 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-300">
                      <X className="h-4 w-4 mr-2" />
                      Отмена
                    </Button>
                    <Button onClick={logout} variant="destructive" className="backdrop-blur-sm transition-all duration-300 hover:scale-105">
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 border-white/30 dark:border-slate-600/30 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-300">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button onClick={() => navigate('/profile/change-password')} variant="outline" className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 border-white/30 dark:border-slate-600/30 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-300">
                      <Key className="h-4 w-4 mr-2" />
                      Сменить пароль
                    </Button>
                    <Button onClick={logout} variant="destructive" className="backdrop-blur-sm transition-all duration-300 hover:scale-105">
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </Button>
                  </>
                )}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="border-t border-white/20 dark:border-slate-700/50 pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Settings className="h-5 w-5" />Настройки</h3>
                <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-slate-700/30 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium text-foreground">Уведомления</p><p className="text-sm text-muted-foreground">Получать уведомления о важных событиях</p></div></div><Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium text-foreground">Двухфакторная аутентификация</p><p className="text-sm text-muted-foreground">Дополнительная защита аккаунта</p></div></div><Switch checked={false} onCheckedChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Palette className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium text-foreground">Темная тема</p><p className="text-sm text-muted-foreground">Переключить на темное оформление</p></div></div><Switch checked={false} onCheckedChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium text-foreground">Язык интерфейса</p><p className="text-sm text-muted-foreground">Выбрать язык приложения</p></div></div><select value="ru" onChange={() => {}} className="h-8 px-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><option value="ru">Русский</option><option value="en">English</option><option value="de">Deutsch</option></select>
                  </div>
                  <Button onClick={() => {}} variant="ghost" className="w-full backdrop-blur-sm hover:bg-white/20 dark:hover:bg-slate-700/20 mt-4"><Settings className="h-4 w-4 mr-2" />Дополнительные настройки</Button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }} className="text-center mt-8 text-sm text-muted-foreground">DevAssist Pro © 2024</motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;