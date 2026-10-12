// api.js



// =================================================================
// ВАРИАНТ 2: РЕАЛЬНОЕ API (ДЛЯ РАБОТЫ С НАСТОЯЩИМ БЭКЕНДОМ)
// Когда бэкенд будет готов на порту 3000, удали код выше и раскомментируй этот
// =================================================================


const CONFIG = {
    API_URL: 'http://localhost:3000/api', 
    TIMEOUT: 10000 // 10 секунд на ожидание
};

export const QrAPI = {
    async generate(payloadData) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

        try {
            const response = await fetch(`${CONFIG.API_URL}/shorten`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payloadData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Возвращаем распарсенный JSON, даже если статус не 200, 
            // чтобы проверить флаг response.status внутри JSON
            return await response.json().catch(() => ({})); 

        } catch (error) {
            clearTimeout(timeoutId);
            throw error; 
        }
    }
};
