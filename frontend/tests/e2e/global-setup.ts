import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Global E2E Test Setup');
  
  // Запускаем браузер для подготовки
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Ждем готовности frontend
    console.log('⏳ Waiting for frontend...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Frontend is ready');
    
    // Ждем готовности backend
    console.log('⏳ Waiting for backend...');
    await page.goto('http://localhost:8000/health');
    const healthCheck = await page.textContent('body');
    if (healthCheck && healthCheck.includes('healthy')) {
      console.log('✅ Backend is ready');
    } else {
      throw new Error('Backend health check failed');
    }
    
    // Подготавливаем тестовые данные если нужно
    console.log('📝 Setting up test data...');
    
    // Здесь можно добавить создание тестовых пользователей, 
    // очистку базы данных и другую подготовку
    
    console.log('✅ Global setup completed');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;