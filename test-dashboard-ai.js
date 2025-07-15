// Тест исправления Dashboard AI статуса
const fetch = require('node-fetch');

async function testDashboardAI() {
    console.log('🧪 Тестирование исправления Dashboard AI статуса...\n');
    
    try {
        // 1. Проверяем providers endpoint
        console.log('1️⃣ Проверяем /api/llm/providers...');
        const providersResponse = await fetch('http://localhost:8000/api/llm/providers');
        const providersData = await providersResponse.json();
        
        console.log('✅ Providers данные получены:');
        console.log('- OpenAI:', providersData.providers?.openai?.status);
        console.log('- Anthropic:', providersData.providers?.anthropic?.status);
        console.log('- Google:', providersData.providers?.google?.status);
        
        // 2. Проверяем health endpoint
        console.log('\n2️⃣ Проверяем /api/llm/health...');
        const healthResponse = await fetch('http://localhost:8000/api/llm/health');
        const healthData = await healthResponse.json();
        
        console.log('✅ Health данные получены:');
        console.log('- Общий статус:', healthData.overall_status);
        console.log('- OpenAI configured:', healthData.providers?.openai?.configured);
        console.log('- OpenAI status:', healthData.providers?.openai?.status);
        console.log('- Anthropic configured:', healthData.providers?.anthropic?.configured);
        console.log('- Anthropic status:', healthData.providers?.anthropic?.status);
        
        // 3. Проверяем логику frontend
        console.log('\n3️⃣ Проверяем логику frontend...');
        
        // Эмулируем логику frontend
        const status = { openai: false, anthropic: false };
        
        // OpenAI статус
        if (providersData.providers?.openai) {
            const isHealthy = healthData?.providers?.openai?.configured === true && 
                             healthData?.providers?.openai?.status === 'healthy';
            status.openai = isHealthy;
            console.log('- OpenAI isHealthy:', isHealthy);
        }
        
        // Anthropic статус
        if (providersData.providers?.anthropic) {
            const isHealthy = healthData?.providers?.anthropic?.configured === true && 
                             healthData?.providers?.anthropic?.status === 'healthy';
            status.anthropic = isHealthy;
            console.log('- Anthropic isHealthy:', isHealthy);
        }
        
        console.log('\n🎯 Результат:');
        console.log('- OpenAI статус в Dashboard:', status.openai ? '✅ Подключен' : '❌ Не подключен');
        console.log('- Anthropic статус в Dashboard:', status.anthropic ? '✅ Подключен' : '❌ Не подключен');
        
        if (status.openai && status.anthropic) {
            console.log('\n🎉 Исправление работает! AI провайдеры должны показываться как подключенные.');
        } else {
            console.log('\n⚠️ Проблема не полностью решена. Проверьте API ключи или логику.');
        }
        
        return status.openai && status.anthropic;
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
        return false;
    }
}

testDashboardAI().then(success => {
    console.log(success ? '\n✅ ТЕСТ ПРОЙДЕН' : '\n❌ ТЕСТ НЕ ПРОЙДЕН');
    process.exit(success ? 0 : 1);
});