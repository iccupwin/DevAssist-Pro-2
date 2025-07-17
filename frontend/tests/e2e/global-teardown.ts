import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global E2E Test Teardown');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Очищаем тестовые данные
    console.log('🗑️ Cleaning up test data...');
    
    // Здесь можно добавить очистку тестовых пользователей,
    // сброс базы данных к исходному состоянию и т.д.
    
    // Пример: удаление тестовых файлов
    // await page.goto('http://localhost:8000/api/test/cleanup', {
    //   waitUntil: 'networkidle'
    // });
    
    console.log('✅ Global teardown completed');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Не бросаем ошибку, чтобы не мешать завершению тестов
  } finally {
    await browser.close();
  }
}

export default globalTeardown;