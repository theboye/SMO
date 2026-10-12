import { QrAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. СЛОВАРЬ ПЕРЕВОДОВ (i18n) ---
    const translations = {
        en: {
            title: "QR Code Generator", subtitle: "Create QR codes for websites, text, locations, and messages",
            mode_title: "Generation Mode", mode_qr: "Link + QR Code", mode_link: "Generate Link Only",
            content_title: "Pick a content type", tab_text: "Text", tab_location: "Location", tab_phone: "Phone",
            colors_title: "Global Colors", lbl_foreground: "MAIN FOREGROUND", lbl_background: "BACKGROUND",
            btn_generate: "Generate", btn_generate_link: "Save Link to Server", btn_download: "Download",
            qr_placeholder: "Fill in the form to get started creating<br>your QR code",
            tab_border: "Border", tab_center: "Center", tab_cells: "Cells",
            st_sq_border: "Square Border", st_ci_border: "Circle Border", st_dt_border: "Dots Border", st_ro_border: "Rounded Border", st_sqr_border: "Squircle Border", st_cf_border: "Cornerflow Border",
            st_sq_center: "Square Center", st_ci_center: "Circle Center", st_dt_center: "Dots Center", st_ro_center: "Rounded Center", st_sqr_center: "Squircle Center", st_cf_center: "Cornerflow Center",
            st_sq_cells: "Square Cells", st_ci_cells: "Circle Cells", st_ro_cells: "Rounded Cells", st_sqr_cells: "Squircle Cells", st_cf_cells: "Cornerflow Cells",
            inp_lbl_url: "URL", inp_ph_url: "https://example.com",
            inp_lbl_text: "TEXT", inp_ph_text: "Enter text...",
            inp_lbl_lat: "LATITUDE", inp_lbl_lng: "LONGITUDE",
            inp_ph_lat: "Click on the map...", inp_ph_lng: "Click on the map...",
            inp_lbl_phone: "PHONE", inp_ph_phone: "+123456789",
            inp_lbl_msg: "MESSAGE", inp_ph_msg: "Type message...",
            inp_lbl_email: "EMAIL", inp_ph_email: "john@example.com",
            inp_lbl_sub: "SUBJECT", inp_ph_sub: "Subject",
            msg_fill_form: "Please fill in the form.", msg_link_ready: "Link created: ",
            err_server: "Server error or invalid data format. Processing stopped.", err_network: "Network error. Please try again."
        },
        ru: {
            title: "Генератор QR-кодов", subtitle: "Создавайте ссылки и QR-коды для сайтов, текста, локаций и визиток",
            mode_title: "Режим работы", mode_qr: "Ссылка + QR-код", mode_link: "Только ссылка",
            content_title: "Тип контента", tab_text: "Текст", tab_location: "Место", tab_phone: "Телефон",
            colors_title: "Цвета QR-кода", lbl_foreground: "ЦВЕТ ЭЛЕМЕНТОВ", lbl_background: "ЦВЕТ ФОНА",
            btn_generate: "Сгенерировать", btn_generate_link: "Сохранить ссылку", btn_download: "Скачать",
            qr_placeholder: "Заполните форму, чтобы<br>создать QR-код",
            tab_border: "Рамки", tab_center: "Центр", tab_cells: "Ячейки",
            st_sq_border: "Квадратная", st_ci_border: "Круглая", st_dt_border: "Точечная", st_ro_border: "Скругленная", st_sqr_border: "Мягкая", st_cf_border: "Каплевидная",
            st_sq_center: "Квадратный", st_ci_center: "Круглый", st_dt_center: "Точечный", st_ro_center: "Скругленный", st_sqr_center: "Мягкий", st_cf_center: "Каплевидный",
            st_sq_cells: "Квадратные", st_ci_cells: "Круглые", st_ro_cells: "Скругленные", st_sqr_cells: "Мягкие", st_cf_cells: "Каплевидные",
            inp_lbl_url: "ССЫЛКА", inp_ph_url: "https://example.com",
            inp_lbl_text: "ТЕКСТ", inp_ph_text: "Введите текст...",
            inp_lbl_lat: "ШИРОТА", inp_lbl_lng: "ДОЛГОТА",
            inp_ph_lat: "Кликните по карте...", inp_ph_lng: "Кликните по карте...",
            inp_lbl_phone: "ТЕЛЕФОН", inp_ph_phone: "+7 (999) 123-45-67",
            inp_lbl_msg: "СООБЩЕНИЕ", inp_ph_msg: "Ваше сообщение...",
            inp_lbl_email: "ПОЧТА", inp_ph_email: "ivan@example.com",
            inp_lbl_sub: "ТЕМА", inp_ph_sub: "Тема письма",
            msg_fill_form: "Пожалуйста, заполните форму.", msg_link_ready: "Ссылка создана: ",
            err_server: "Ошибка сервера. Обработка остановлена.", err_network: "Ошибка сети. Попробуйте еще раз."
        }
    };

    // --- 2. ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    const state = {
        lang: localStorage.getItem('qr_lang') || 'en',
        mode: 'qr', 
        type: 'URL',
        bgColor: '#FFFFFF',
        fgColor: '#000000',
        design: { cells: 'square', border: 'square', center: 'square' }
    };

    let qrCode = null;
    let mapInstance = null;
    let mapMarker = null;

    // --- 3. ИНИЦИАЛИЗАЦИЯ МУЛЬТИЯЗЫЧНОСТИ ---
    const langSwitch = document.getElementById('lang-switch');
    langSwitch.value = state.lang;

    const applyTranslations = () => {
        const dict = translations[state.lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.innerHTML = dict[key];
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            if (dict[key]) el.setAttribute('placeholder', dict[key]);
        });
        const genBtn = document.getElementById('generate-btn');
        genBtn.innerHTML = state.mode === 'qr' ? dict.btn_generate : dict.btn_generate_link;
        document.documentElement.lang = state.lang;
    };

    langSwitch.addEventListener('change', (e) => {
        state.lang = e.target.value;
        localStorage.setItem('qr_lang', state.lang);
        renderForm(state.type); 
        applyTranslations();
    });

    // --- 4. ШАБЛОНЫ ФОРМ ---
    const templates = {
        'URL': `<div class="input-group"><label data-i18n="inp_lbl_url">URL</label><input type="url" id="val-url" data-i18n-ph="inp_ph_url"></div>`,
        'Text': `<div class="input-group"><label data-i18n="inp_lbl_text">TEXT</label><textarea id="val-text" data-i18n-ph="inp_ph_text"></textarea></div>`,
        'Location': `
            <div id="map-container"></div>
            <div style="display: flex; gap: 1rem;">
                <div class="input-group" style="flex: 1;"><label data-i18n="inp_lbl_lat">LATITUDE</label><input type="text" id="val-lat" readonly data-i18n-ph="inp_ph_lat"></div>
                <div class="input-group" style="flex: 1;"><label data-i18n="inp_lbl_lng">LONGITUDE</label><input type="text" id="val-lng" readonly data-i18n-ph="inp_ph_lng"></div>
            </div>
        `,
        'SMS': `<div class="input-group"><label data-i18n="inp_lbl_phone">PHONE</label><input type="tel" id="val-phone" data-i18n-ph="inp_ph_phone"></div><div class="input-group"><label data-i18n="inp_lbl_msg">MESSAGE</label><textarea id="val-sms" data-i18n-ph="inp_ph_msg"></textarea></div>`,
        'Phone': `<div class="input-group"><label data-i18n="inp_lbl_phone">PHONE</label><input type="tel" id="val-tel" data-i18n-ph="inp_ph_phone"></div>`,
        'Email': `<div class="input-group"><label data-i18n="inp_lbl_email">EMAIL</label><input type="email" id="val-email" data-i18n-ph="inp_ph_email"></div><div class="input-group"><label data-i18n="inp_lbl_sub">SUBJECT</label><input type="text" id="val-sub" data-i18n-ph="inp_ph_sub"></div><div class="input-group"><label data-i18n="inp_lbl_msg">MESSAGE</label><textarea id="val-msg" data-i18n-ph="inp_ph_msg"></textarea></div>`
    };

    // Инициализация карты Leaflet
    const initMap = () => {
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
            mapMarker = null;
        }

        const defaultCoords = [51.505, -0.09]; // Центр по умолчанию
        mapInstance = L.map('map-container').setView(defaultCoords, 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance);

        const latInput = document.getElementById('val-lat');
        const lngInput = document.getElementById('val-lng');

        mapInstance.on('click', function(e) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);

            latInput.value = lat;
            lngInput.value = lng;

            if (mapMarker) {
                mapMarker.setLatLng(e.latlng);
            } else {
                mapMarker = L.marker(e.latlng).addTo(mapInstance);
            }
        });

        // Фикс отображения карты
        setTimeout(() => mapInstance.invalidateSize(), 100);
    };

    const renderForm = (type) => {
        document.getElementById('dynamic-form').innerHTML = templates[type];
        applyTranslations(); 
        if (type === 'Location') initMap();
    };

    // --- 5. ЛОГИКА РЕЖИМОВ ---
    document.querySelectorAll('input[name="gen_mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.mode = e.target.value;
            const previewPanel = document.getElementById('preview-section');
            const colorsSection = document.getElementById('colors-section');
            
            if (state.mode === 'link') {
                previewPanel.classList.add('disabled');
                colorsSection.classList.add('disabled');
                document.getElementById('download-btn').classList.add('hidden');
                document.getElementById('qr-canvas').innerHTML = `<div class="placeholder-text">${translations[state.lang].mode_link}</div>`;
                qrCode = null;
            } else {
                previewPanel.classList.remove('disabled');
                colorsSection.classList.remove('disabled');
                document.getElementById('qr-canvas').innerHTML = `<div class="placeholder-text">${translations[state.lang].qr_placeholder}</div>`;
            }
            applyTranslations(); 
        });
    });

    const buildDataString = () => {
        const type = state.type;
        if (type === 'URL') return document.getElementById('val-url').value;
        if (type === 'Text') return document.getElementById('val-text').value;
        if (type === 'Location') {
            const lat = document.getElementById('val-lat').value;
            const lng = document.getElementById('val-lng').value;
            if (!lat || !lng) return '';
            return `geo:${lat},${lng}`;
        }
        if (type === 'SMS') return `SMSTO:${document.getElementById('val-phone').value}:${document.getElementById('val-sms').value}`;
        if (type === 'Phone') return `tel:${document.getElementById('val-tel').value}`;
        if (type === 'Email') return `mailto:${document.getElementById('val-email').value}?subject=${encodeURIComponent(document.getElementById('val-sub').value)}&body=${encodeURIComponent(document.getElementById('val-msg').value)}`;
        return '';
    };

    // --- 6. ОСНОВНОЙ ВЫЗОВ (API + ВАЛИДАЦИЯ ФЛАГА) ---

// Helper function to show a persistent, copyable result window
const displayResultWindow = (shortLink, isQrMode, dict) => {
    // Remove existing result window if it exists
    const existing = document.getElementById('persistent-result');
    if (existing) existing.remove();

    const resultDiv = document.createElement('div');
    resultDiv.id = 'persistent-result';
    resultDiv.className = 'result-window';

    resultDiv.innerHTML = `
        <div class="result-header">
            <span>${dict.msg_link_ready}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="close-result">✕</button>
        </div>
        <div class="result-body">
            <div class="copy-container">
                <input type="text" value="${shortLink}" id="shortLinkField" readonly>
                <button id="copy-btn" class="btn-copy">Copy</button>
            </div>
            <p class="hint">Link stays active for 30 days.</p>
        </div>
    `;

    // Append to the config panel (right side)
    document.querySelector('.config-panel').appendChild(resultDiv);

    // Setup Copy Logic
    document.getElementById('copy-btn').addEventListener('click', () => {
        const input = document.getElementById('shortLinkField');
        input.select();
        document.execCommand('copy');
        document.getElementById('copy-btn').innerText = 'Copied!';
        setTimeout(() => { document.getElementById('copy-btn').innerText = 'Copy'; }, 2000);
    });
};

const processAction = async () => {
    const data = buildDataString();
    const dict = translations[state.lang];

    if (!data) {
        alert(dict.msg_fill_form);
        return;
    }

    const requestPayload = {
        payload: data,
        type: state.type.toLowerCase(),
        generateQr: state.mode === 'qr'
    };
    
    const btn = document.getElementById('generate-btn');
    const originalBtnText = btn.innerHTML;

    try {
        btn.innerHTML = state.lang === 'en' ? 'Processing... ⏳' : 'Сохранение... ⏳';
        btn.disabled = true;

        const response = await QrAPI.generate(requestPayload);

        if (!response || response.status !== 'success') {
            alert(response?.message || dict.err_server);
            return;
        }

        const shortLink = response.data.shortLink;

        // 1. ALWAYS show the persistent link window (Fixes your "disappearing" issue)
        displayResultWindow(shortLink, state.mode === 'qr', dict);

        // 2. If in QR mode, also update the big preview on the left
        if (state.mode === 'qr') {
            const canvasContainer = document.getElementById('qr-canvas');
            canvasContainer.innerHTML = '';
            
            qrCode = new QRCodeStyling({
                width: 300, height: 300, data: shortLink,
                qrOptions: { errorCorrectionLevel: 'H' },
                dotsOptions: { color: state.fgColor, type: state.design.cells },
                backgroundOptions: { color: state.bgColor },
                cornersSquareOptions: { color: state.fgColor, type: state.design.border },
                cornersDotOptions: { color: state.fgColor, type: state.design.center }
            });
            
            qrCode.append(canvasContainer);
            document.getElementById('download-btn').classList.remove('hidden');
        }

    } catch (error) {
        console.error('API Error:', error);
        alert(dict.err_network);
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
    }
};

    // --- 7. ОБРАБОТЧИКИ СОБЫТИЙ (UI) ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.type = e.target.dataset.type;
            renderForm(state.type);
        });
    });

    document.querySelectorAll('.toolbar-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.toolbar-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.toolbar-pane').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    document.querySelectorAll('.style-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const btn = e.target.closest('.style-card');
            btn.parentElement.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            state.design[btn.dataset.part] = btn.dataset.val;
            
            if (qrCode && state.mode === 'qr') {
                qrCode.update({
                    dotsOptions: { type: state.design.cells },
                    cornersSquareOptions: { type: state.design.border },
                    cornersDotOptions: { type: state.design.center }
                });
            }
        });
    });

    const updateGlobalColor = (key, val, hexId, colorId) => {
        state[key] = val;
        document.getElementById(hexId).value = val.toUpperCase();
        document.getElementById(colorId).value = val;
        
        if (qrCode && state.mode === 'qr') {
            qrCode.update({
                dotsOptions: { color: state.fgColor },
                cornersSquareOptions: { color: state.fgColor },
                cornersDotOptions: { color: state.fgColor },
                backgroundOptions: { color: state.bgColor }
            });
        }
    };

    document.getElementById('fg-color').addEventListener('input', (e) => updateGlobalColor('fgColor', e.target.value, 'fg-hex', 'fg-color'));
    document.getElementById('fg-hex').addEventListener('change', (e) => updateGlobalColor('fgColor', e.target.value, 'fg-hex', 'fg-color'));
    document.getElementById('bg-color').addEventListener('input', (e) => updateGlobalColor('bgColor', e.target.value, 'bg-hex', 'bg-color'));
    document.getElementById('bg-hex').addEventListener('change', (e) => updateGlobalColor('bgColor', e.target.value, 'bg-hex', 'bg-color'));

    document.getElementById('generate-btn').addEventListener('click', processAction);
    document.getElementById('download-btn').addEventListener('click', () => {
        if (qrCode) qrCode.download({ name: "qr-code", extension: "png" });
    });

    renderForm(state.type);
    applyTranslations();
});