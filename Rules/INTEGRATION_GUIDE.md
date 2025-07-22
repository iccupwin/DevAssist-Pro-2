# 🔗 Интеграция React Frontend с Streamlit Backend

## 🚀 Как это работает

1. **React App** (порт 3000) - Аутентификация
2. **Streamlit App** (порт 8501) - Главное приложение 
3. После успешного входа → автоматическое перенаправление

## 📋 Запуск обеих частей

### 1️⃣ Запуск Streamlit (главное приложение)
```bash
# В корневой папке проекта
streamlit run app.py
```
**Будет доступно на**: `http://localhost:8501`

### 2️⃣ Запуск React (аутентификация)  
```bash
# В папке frontend
cd frontend
npm start
```
**Будет доступно на**: `http://localhost:3000`

## 🔄 Флоу аутентификации

### 🎯 Успешный вход:
1. Пользователь заходит на `http://localhost:3000`
2. Заполняет форму входа/регистрации
3. При успехе → **автоматическое перенаправление** на `http://localhost:8501`
4. Данные пользователя сохраняются в `localStorage`

### 💾 Сохраняемые данные:
```javascript
localStorage.getItem('devassist_user')
// Содержит:
{
  "email": "user@example.com",
  "firstName": "Иван", 
  "lastName": "Иванов",
  "organization": "Компания",
  "loginTime": "2025-06-26T19:00:00.000Z",
  "isAuthenticated": true
}
```

## ⚙️ Настройка URL (опционально)

В файле `frontend/.env` можно изменить URL Streamlit:
```bash
# Если Streamlit запущен на другом порту
REACT_APP_STREAMLIT_URL=http://localhost:8502

# Для production
REACT_APP_STREAMLIT_URL=https://yourapp.streamlit.app
```

## 🔧 Интеграция с Streamlit

В вашем `app.py` можно проверить аутентификацию:

```python
import streamlit as st
import json

# Функция для проверки аутентификации (добавить в app.py)
def check_authentication():
    # Простая проверка через JavaScript
    auth_check = st.components.v1.html("""
    <script>
    const userData = localStorage.getItem('devassist_user');
    if (userData) {
        const user = JSON.parse(userData);
        if (user.isAuthenticated) {
            document.write('authenticated:' + user.email);
        } else {
            document.write('not_authenticated');
        }
    } else {
        document.write('not_authenticated');  
    }
    </script>
    """, height=0)
    
    return auth_check

# Использование в главной функции
def main():
    # Проверка аутентификации
    auth_status = check_authentication()
    
    if 'not_authenticated' in str(auth_status):
        st.error("Пожалуйста, войдите в систему")
        if st.button("Перейти к входу"):
            st.components.v1.html("""
            <script>
            window.location.href = 'http://localhost:3000';
            </script>
            """, height=0)
        return
    
    # Ваш основной код приложения
    st.title("DevAssist Pro - Главная панель")
    # ... остальной код
```

## 🎯 Тестирование интеграции

### ✅ Проверочный список:

1. **Запустить Streamlit**: `streamlit run app.py`
2. **Запустить React**: `npm start` (в папке frontend)
3. **Перейти на**: `http://localhost:3000`
4. **Ввести любые валидные данные** в форму входа
5. **Проверить перенаправление** на `http://localhost:8501`
6. **Проверить localStorage** в браузере (F12 → Application → Local Storage)

### 🔍 Отладка:

Если перенаправление не работает:
- Убедитесь, что Streamlit запущен на порту 8501
- Проверьте консоль браузера (F12) на ошибки
- Проверьте настройки в `.env` файле

## 📱 Production готовность

Для production развертывания:
1. Измените URL в `.env` на ваш домен
2. Настройте HTTPS для обеих частей
3. Реализуйте настоящую backend аутентификацию
4. Добавьте проверку токенов безопасности

---

**Интеграция готова!** 🎉