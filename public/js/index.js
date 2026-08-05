// Socket is configured once in connection.js.
const socket = window.socket;

const roomCodeInput = document.getElementById('roomCode');
const joinBtn = document.getElementById('joinBtn');
const createBtn = document.getElementById('createBtn');
const errorDiv = document.getElementById('error');

// Модальное окно с информацией
const infoModal = document.getElementById('infoModal');
const infoModalClose = document.getElementById('infoModalClose');
const infoBtn = document.getElementById('infoBtn');

// Выбор игры
const gameModal = document.getElementById('gameModal');
const gameModalClose = document.getElementById('gameModalClose');
const gameBtn = document.getElementById('gameBtn');
const gameOptions = document.querySelectorAll('.game-option');
const games = {
    'brain-ring': 'Brain Ring',
    'dapoi-hit': 'Допой Хит!'
};
let selectedGame = localStorage.getItem('selectedGame') || 'brain-ring';

function updateSelectedGame() {
    gameBtn.textContent = `Выбрать игру: ${games[selectedGame]}`;
    document.body.classList.toggle('theme-dapoi-hit', selectedGame === 'dapoi-hit');
    gameOptions.forEach((option) => {
        option.classList.toggle('selected', option.dataset.game === selectedGame);
    });
}

function openGameModal() {
    gameModal.classList.add('show');
    gameModal.setAttribute('aria-hidden', 'false');
}

function closeGameModal() {
    gameModal.classList.remove('show');
    gameModal.setAttribute('aria-hidden', 'true');
}

updateSelectedGame();

// Функция для открытия модального окна
function openInfoModal() {
    if (infoModal) {
        infoModal.classList.add('show');
    }
}

// Функция для закрытия модального окна
function closeInfoModal() {
    if (infoModal) {
        infoModal.classList.remove('show');
        localStorage.setItem('brainRingInfoSeen', 'true');
    }
}

// Проверяем, показывали ли уже модальное окно
const hasSeenInfo = localStorage.getItem('brainRingInfoSeen');

// Показываем модальное окно только при первом входе
if (infoModal && !hasSeenInfo) {
    openInfoModal();
}

// Открытие модального окна по кнопке информации
if (infoBtn) {
    infoBtn.addEventListener('click', () => {
        openInfoModal();
    });
}

gameBtn.addEventListener('click', openGameModal);

gameModalClose.addEventListener('click', closeGameModal);

gameOptions.forEach((option) => {
    option.addEventListener('click', () => {
        selectedGame = option.dataset.game;
        localStorage.setItem('selectedGame', selectedGame);
        updateSelectedGame();
        closeGameModal();
    });
});

gameModal.addEventListener('click', (e) => {
    if (e.target === gameModal) {
        closeGameModal();
    }
});

// Закрытие модального окна
if (infoModalClose) {
    infoModalClose.addEventListener('click', () => {
        closeInfoModal();
    });
}

// Закрытие при клике на фон
if (infoModal) {
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            closeInfoModal();
        }
    });
}

// Проверяем параметр room в URL
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam && /^\d{6}$/.test(roomParam)) {
    roomCodeInput.value = roomParam;
}

// Разрешаем только цифры в поле кода комнаты
roomCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
    errorDiv.textContent = '';
});

// Вход в комнату
joinBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim();
    
    if (code.length !== 6) {
        errorDiv.textContent = 'Код комнаты должен содержать 6 цифр';
        return;
    }

    // Сохраняем код комнаты в sessionStorage для player.html
    sessionStorage.setItem('roomCode', code);
    window.location.href = 'player.html';
});

// Ввод по Enter
roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinBtn.click();
    }
});

// Создание комнаты
createBtn.addEventListener('click', () => {
    socket.emit('create-room', { gameId: selectedGame });
});

// Получение кода созданной комнаты
socket.on('room-created', ({ roomCode }) => {
    // Сохраняем код комнаты в sessionStorage для host.html
    sessionStorage.setItem('roomCode', roomCode);
    window.location.href = 'host.html';
});

// Ошибка при создании комнаты
socket.on('room-error', ({ message }) => {
    errorDiv.textContent = message;
});

