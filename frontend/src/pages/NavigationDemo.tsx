import React from 'react';
import { NavigationBar } from '../components/ui/NavigationBar';

const NavigationDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavigationBar />
      
      {/* Контент для демонстрации скролла */}
      <main className="pt-20">
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Демонстрация Navigation Bar
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Прокрутите страницу вниз, чтобы увидеть, как навигация сжимается, закругляется и становится полупрозрачной с эффектом blur
            </p>
            <div className="text-sm text-muted-foreground">
              ↓ Скролите вниз ↓
            </div>
          </div>
        </section>

        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700">
          <div className="text-center max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Эффекты навигации
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="p-6 bg-white/80 dark:bg-gray-900/80 rounded-lg backdrop-blur">
                <h3 className="text-xl font-semibold mb-3">При скролле:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✨ Ширина уменьшается с max-w-6xl до max-w-4xl</li>
                  <li>🔄 Края скругляются с rounded-2xl</li>
                  <li>🌫️ Фон становится полупрозрачным (bg-background/80)</li>
                  <li>🔍 Добавляется blur эффект (backdrop-blur-md)</li>
                </ul>
              </div>
              <div className="p-6 bg-white/80 dark:bg-gray-900/80 rounded-lg backdrop-blur">
                <h3 className="text-xl font-semibold mb-3">Анимации:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>⚡ Плавные переходы (duration-500)</li>
                  <li>🎯 Красивая анимация ease-in-out</li>
                  <li>📱 Адаптивный дизайн для мобильных</li>
                  <li>🎨 Стильные тени и эффекты</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-700 dark:to-gray-600">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Отличная навигация!
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Navigation Bar адаптируется под скролл пользователя, обеспечивая отличный UX
            </p>
            <div className="text-sm text-muted-foreground">
              ↑ Прокрутите обратно наверх ↑
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NavigationDemo;