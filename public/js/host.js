// Socket is configured once in connection.js.
const socket = window.socket;

const roomCodeDiv = document.getElementById('roomCode');
const shareLinkInput = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const playersCountDiv = document.getElementById('playersCount');
const lastWinnerNameDiv = document.getElementById('lastWinnerName');
const playersList = document.getElementById('playersList');

// Получаем код комнаты из sessionStorage
const roomCode = sessionStorage.getItem('roomCode');

const qrDiv = document.getElementById('qr');
const qrLink = document.getElementById('qrLink');

function applyGameTheme(gameId) {
    document.body.classList.toggle('theme-dapoi-hit', gameId === 'dapoi-hit');
}

if (!roomCode) {
    // Если кода нет, возвращаемся на главную
    window.location.href = 'index.html';
} else {
    // Отображаем код комнаты
    roomCodeDiv.textContent = roomCode;

    // Формируем ссылку для входа
    const shareUrl = `${window.location.origin}/index.html?room=${roomCode}`;
    shareLinkInput.value = shareUrl;

    // Формируем ссылку для QR-кода (на player.html с параметром code)
    const playerUrl = `${window.location.origin}/player.html?code=${roomCode}`;
    
    // Функция для генерации QR-кода с правильным размером (только для мобильных)
    function generateQRCode() {
        const qrCard = document.querySelector('.qr-card');
        if (!qrCard || !qrDiv) return;
        
        // Проверяем, мобильное ли это устройство
        const isMobile = window.innerWidth <= 1023;
        
        if (isMobile) {
            // Для мобильных: вычисляем размер динамически
            const cardRect = qrCard.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(qrCard);
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
            const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
            const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
            
            const availableWidth = cardRect.width - paddingLeft - paddingRight;
            const availableHeight = cardRect.height - paddingTop - paddingBottom;
            
            // Вычисляем размер QR-кода (минимум из ширины и высоты)
            const qrSize = Math.min(availableWidth, availableHeight);
            
            // Минимальный размер для читаемости QR-кода
            const minSize = 200;
            const finalSize = Math.max(qrSize, minSize);
            
            // Очищаем перед генерацией
            qrDiv.innerHTML = '';
            
            // Генерируем QR-код с вычисленным размером
            new QRCode(qrDiv, {
                text: playerUrl,
                width: finalSize,
                height: finalSize
            });
        } else {
            // Для desktop: используем стандартный размер (как было раньше)
            qrDiv.innerHTML = '';
            new QRCode(qrDiv, {
                text: playerUrl,
                width: 320,
                height: 320
            });
        }
    }
    
    // Генерируем QR-код после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(generateQRCode, 100);
        });
    } else {
        setTimeout(generateQRCode, 100);
    }
    
    // Пересоздаем QR-код при изменении размера окна (только для мобильных устройств)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Пересоздаем только на мобильных устройствах
        if (window.innerWidth <= 1023) {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                generateQRCode();
            }, 250);
        }
    });
    
    // Устанавливаем текстовую ссылку
    qrLink.href = playerUrl;
    qrLink.textContent = playerUrl;

    // Копирование ссылки
    copyBtn.addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Скопировано!';
        setTimeout(() => {
            copyBtn.textContent = 'Копировать';
        }, 2000);
    });

}

// Socket.IO assigns a new ID after reconnecting, so the host must rejoin the room.
socket.on('connect', () => {
    if (roomCode) {
        socket.emit('join-room', { roomCode, role: 'host' });
    }
});

// Обработка обновлений комнаты
socket.on('roomUpdate', ({ gameId, playersCount, lastWinnerName, locked, players }) => {
    applyGameTheme(gameId);
    playersCountDiv.textContent = playersCount;
    lastWinnerNameDiv.textContent = lastWinnerName || '—';
    
    // Полностью перерисовываем список игроков (через запятую)
    if (players && players.length > 0) {
        playersList.textContent = players.join(', ');
    } else {
        playersList.textContent = '';
    }
});

socket.on('room-joined', ({ roomCode: joinedRoomCode, gameId }) => {
    applyGameTheme(gameId);
    console.log('Host joined room:', joinedRoomCode);
});

socket.on('room-error', ({ message }) => {
    alert(message);
    window.location.href = 'index.html';
});

