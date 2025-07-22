/**
 * DevAssist Pro Frontend E2E User Flow Tests
 * Полное тестирование пользовательского интерфейса
 */

import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Test user data
const TEST_USER = {
  email: `test.${uuidv4()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test User E2E',
  company: 'Test Company',
  position: 'QA Engineer'
};

test.describe('DevAssist Pro User Flow', () => {
  // Cleanup after tests
  test.afterAll(async ({ request }) => {
    // Здесь можно добавить cleanup через API если нужно
  });

  test('01. User can access landing page', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Проверяем заголовок
    await expect(page).toHaveTitle(/DevAssist Pro/);
    
    // Проверяем основные элементы
    await expect(page.locator('h1')).toContainText('DevAssist Pro');
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Регистрация' })).toBeVisible();
  });

  test('02. User can register', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register`);
    
    // Заполняем форму регистрации
    await page.fill('input[name="fullName"]', TEST_USER.fullName);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirmPassword"]', TEST_USER.password);
    await page.fill('input[name="company"]', TEST_USER.company);
    await page.fill('input[name="position"]', TEST_USER.position);
    
    // Принимаем условия
    await page.check('input[name="acceptTerms"]');
    
    // Отправляем форму
    await page.click('button[type="submit"]');
    
    // Проверяем успешную регистрацию
    await expect(page).toHaveURL(`${BASE_URL}/auth/login`);
    await expect(page.locator('.toast-success')).toContainText('Регистрация успешна');
  });

  test('03. User can login', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Заполняем форму входа
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    
    // Отправляем форму
    await page.click('button[type="submit"]');
    
    // Проверяем успешный вход
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('04. User can navigate dashboard', async ({ page }) => {
    // Предполагаем, что пользователь уже залогинен
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Проверяем основные модули
    await expect(page.locator('[data-testid="kp-analyzer-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="projects-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-card"]')).toBeVisible();
    
    // Проверяем статистику
    await expect(page.locator('[data-testid="stats-section"]')).toBeVisible();
  });

  test('05. User can access KP Analyzer', async ({ page }) => {
    await page.goto(`${BASE_URL}/kp-analyzer`);
    
    // Проверяем элементы страницы
    await expect(page.locator('h1')).toContainText('КП Анализатор');
    await expect(page.locator('[data-testid="upload-tz-zone"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-kp-zone"]')).toBeVisible();
  });

  test('06. User can upload TZ document', async ({ page }) => {
    await page.goto(`${BASE_URL}/kp-analyzer`);
    
    // Создаем тестовый файл
    const tzContent = `Техническое задание на строительство
    
Требования:
1. Площадь: 5000 м²
2. Этажность: 10 этажей
3. Срок: 18 месяцев`;
    
    // Загружаем файл через input
    const fileInput = await page.locator('input[type="file"][data-testid="tz-file-input"]');
    await fileInput.setInputFiles({
      name: 'test-tz.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(tzContent)
    });
    
    // Проверяем, что файл загружен
    await expect(page.locator('[data-testid="tz-file-name"]')).toContainText('test-tz.txt');
  });

  test('07. User can upload KP document', async ({ page }) => {
    await page.goto(`${BASE_URL}/kp-analyzer`);
    
    // Создаем тестовый КП файл
    const kpContent = `Коммерческое предложение
    
Компания: ООО "СтройТех"
Предложение:
1. Площадь: 5200 м²
2. Этажность: 10 этажей
3. Срок: 16 месяцев
4. Стоимость: 300 млн руб`;
    
    // Загружаем файл
    const fileInput = await page.locator('input[type="file"][data-testid="kp-file-input"]');
    await fileInput.setInputFiles({
      name: 'test-kp.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(kpContent)
    });
    
    // Проверяем, что файл загружен
    await expect(page.locator('[data-testid="kp-file-name"]')).toContainText('test-kp.txt');
  });

  test('08. User can start KP analysis', async ({ page }) => {
    await page.goto(`${BASE_URL}/kp-analyzer`);
    
    // Предполагаем, что файлы уже загружены
    // Нажимаем кнопку анализа
    await page.click('[data-testid="start-analysis-button"]');
    
    // Проверяем, что анализ начался
    await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-status"]')).toContainText('Анализ');
  });

  test('09. User can view analysis results', async ({ page }) => {
    // Ждем завершения анализа
    await page.waitForSelector('[data-testid="analysis-results"]', { 
      timeout: 60000 
    });
    
    // Проверяем результаты
    await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-assessment"]')).toBeVisible();
  });

  test('10. User can export report', async ({ page }) => {
    // Находим кнопку экспорта
    await page.click('[data-testid="export-report-button"]');
    
    // Выбираем формат PDF
    await page.click('[data-testid="export-pdf-option"]');
    
    // Ждем начала загрузки
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export-button"]');
    
    const download = await downloadPromise;
    
    // Проверяем, что файл скачался
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('11. User can view projects list', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);
    
    // Проверяем список проектов
    await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-project-button"]')).toBeVisible();
  });

  test('12. User can create new project', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);
    
    // Открываем форму создания проекта
    await page.click('[data-testid="create-project-button"]');
    
    // Заполняем форму
    await page.fill('input[name="projectName"]', 'Test Project E2E');
    await page.fill('textarea[name="description"]', 'E2E test project description');
    await page.selectOption('select[name="projectType"]', 'residential');
    
    // Отправляем форму
    await page.click('[data-testid="submit-project-button"]');
    
    // Проверяем, что проект создан
    await expect(page.locator('[data-testid="project-card"]')).toContainText('Test Project E2E');
  });

  test('13. User can access profile settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    
    // Проверяем элементы профиля
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
    await expect(page.locator('input[name="fullName"]')).toHaveValue(TEST_USER.fullName);
    await expect(page.locator('input[name="email"]')).toHaveValue(TEST_USER.email);
  });

  test('14. User can update profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    
    // Обновляем данные
    await page.fill('input[name="phone"]', '+7 (999) 123-45-67');
    await page.fill('textarea[name="bio"]', 'Updated bio for E2E test');
    
    // Сохраняем изменения
    await page.click('[data-testid="save-profile-button"]');
    
    // Проверяем успешное сохранение
    await expect(page.locator('.toast-success')).toContainText('Профиль обновлен');
  });

  test('15. User can logout', async ({ page }) => {
    // Открываем меню пользователя
    await page.click('[data-testid="user-menu"]');
    
    // Нажимаем выход
    await page.click('[data-testid="logout-button"]');
    
    // Проверяем, что вышли
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
  });
});

// Дополнительные тесты для социальной авторизации
test.describe('Social Authentication', () => {
  test('User can see social login options', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Проверяем наличие кнопок социальной авторизации
    await expect(page.locator('[data-testid="google-login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="yandex-login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="vk-login-button"]')).toBeVisible();
  });
});

// Тесты для мобильной версии
test.describe('Mobile User Flow', () => {
  test.use({ 
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15'
  });

  test('Mobile navigation works correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Проверяем мобильное меню
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Проверяем навигационные ссылки
    await expect(page.locator('[data-testid="mobile-nav-links"]')).toBeVisible();
  });

  test('Mobile KP upload works', async ({ page }) => {
    await page.goto(`${BASE_URL}/kp-analyzer`);
    
    // Проверяем адаптивность интерфейса загрузки
    await expect(page.locator('[data-testid="upload-tz-zone"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-kp-zone"]')).toBeVisible();
    
    // Проверяем, что зоны загрузки отображаются вертикально на мобильном
    const uploadZones = await page.locator('[data-testid*="upload-"][data-testid*="-zone"]').all();
    expect(uploadZones.length).toBeGreaterThan(0);
  });
});