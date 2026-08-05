// Socket is configured once in connection.js.
const socket = window.socket;

const nameInputState = document.getElementById('nameInputState');
const gameState = document.getElementById('gameState');
const playerNameInput = document.getElementById('playerName');
const submitNameBtn = document.getElementById('submitNameBtn');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const pressBtn = document.getElementById('pressBtn');
const statusMessage = document.getElementById('statusMessage');

let playerName = '';
let roomCode = '';

function applyGameTheme(gameId) {
    document.body.classList.toggle('theme-dapoi-hit', gameId === 'dapoi-hit');
}

// Звук для победителя
const winSound = new Audio('sounds/The_sound_of_pressin.mp3');
winSound.preload = 'auto'; // Предзагрузка звука
winSound.volume = 1.0; // Устанавливаем максимальную громкость
let hasPlayedSound = false; // Флаг для предотвращения повторного воспроизведения

// Получаем код комнаты из sessionStorage или URL
const urlParams = new URLSearchParams(window.location.search);
roomCode = sessionStorage.getItem('roomCode') || urlParams.get('room') || urlParams.get('code') || '';

if (!roomCode) {
    // Если кода нет, возвращаемся на главную
    window.location.href = 'index.html';
    throw new Error('No room code');
}

// Проверяем, есть ли сохраненное имя в localStorage
const savedName = localStorage.getItem('playerName');
if (savedName) {
    playerName = savedName;
    playerNameInput.value = savedName;
    // Можно сразу перейти к игре, но лучше показать экран ввода для подтверждения
}

// Отправка имени
submitNameBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    
    if (!name) {
        alert('Пожалуйста, введите имя');
        return;
    }

    playerName = name;
    // Сохраняем имя в localStorage
    localStorage.setItem('playerName', playerName);

    // Переключаемся на экран игры
    nameInputState.classList.add('hidden');
    gameState.classList.remove('hidden');
    playerNameDisplay.textContent = playerName;

    joinRoom();
});

// Ввод по Enter
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitNameBtn.click();
    }
});

// Отправляем сигнал сразу при касании, не дожидаясь события click на мобильном.
function sendBuzz() {
    if (pressBtn.disabled) {
        return;
    }

    // Сервер всё равно определяет победителя, но пользователь получает мгновенную реакцию.
    pressBtn.disabled = true;
    socket.emit('buzz', { roomCode, name: playerName });
}

pressBtn.addEventListener('pointerdown', (event) => {
    if (event.button === 0) {
        sendBuzz();
    }
});

// Поддержка клавиатуры: она не создаёт pointerdown.
pressBtn.addEventListener('click', sendBuzz);

function joinRoom() {
    socket.emit('join-room', { roomCode, role: 'player', name: playerName });
}

// Socket.IO assigns a new ID after reconnecting, so the player must rejoin the room.
socket.on('connect', () => {
    if (playerName) {
        joinRoom();
    }
});

// События от сервера
socket.on('room-joined', ({ roomCode: joinedRoomCode, gameId }) => {
    applyGameTheme(gameId);
    console.log('Joined room:', joinedRoomCode);
    statusMessage.textContent = 'Готовы! Нажмите кнопку, когда будете готовы.';
});

// Обработка обновлений комнаты
socket.on('roomUpdate', ({ gameId, playersCount, lastWinnerName, locked }) => {
    applyGameTheme(gameId);
    if (locked) {
        pressBtn.disabled = true;
        if (lastWinnerName === playerName) {
            statusMessage.textContent = '🎉 ВЫ ВЫИГРАЛИ!';
            statusMessage.className = 'status-message winner';
            // Воспроизводим звук только один раз для победителя
            if (!hasPlayedSound) {
                // Сбрасываем звук на начало для повторного воспроизведения
                winSound.currentTime = 0;
                winSound.play().then(() => {
                    console.log('Звук победителя воспроизведен успешно');
                }).catch(err => {
                    console.error('Ошибка воспроизведения звука:', err);
                });
                hasPlayedSound = true;
            }
        } else {
            statusMessage.textContent = `Победитель: ${lastWinnerName}`;
            statusMessage.className = 'status-message locked';
        }
    } else {
        // Сбрасываем флаг при разблокировке для следующего раунда
        hasPlayedSound = false;
        pressBtn.disabled = false;
        if (lastWinnerName === playerName) {
            statusMessage.textContent = '🎉 ВЫ ВЫИГРАЛИ!';
            statusMessage.className = 'status-message winner';
        } else {
            statusMessage.textContent = 'Готовы! Нажмите кнопку, когда будете готовы.';
            statusMessage.className = 'status-message';
        }
    }
});

socket.on('room-error', ({ message }) => {
    alert(message);
    window.location.href = 'index.html';
});

