const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    // Set CLIENT_ORIGIN to the Vercel/Netlify URL (or a comma-separated list).
    // In local development, allow the frontend from any origin.
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST']
  }
});

// Хранилище комнат: { roomCode: { gameId, players, hosts, lastWinnerName, lockedUntil } }
const rooms = new Map();

// Генерация 6-значного кода комнаты
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
}

// Отправка обновления комнаты всем в комнате
function sendRoomUpdate(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const playersCount = room.players.size;
  const lastWinnerName = room.lastWinnerName || null;
  const locked = room.lockedUntil > Date.now();
  // Массив имён игроков (только role="player", host не входит)
  const players = Array.from(room.players.values());

  io.to(roomCode).emit('roomUpdate', {
    gameId: room.gameId,
    playersCount,
    lastWinnerName,
    locked,
    players
  });
}

function scheduleRoomCleanup(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.players.size > 0 || room.hosts.size > 0 || room.cleanupTimeout) {
    return;
  }

  // Keep an empty room briefly so a reconnecting host can rejoin it.
  room.cleanupTimeout = setTimeout(() => {
    const currentRoom = rooms.get(roomCode);
    if (currentRoom && currentRoom.players.size === 0 && currentRoom.hosts.size === 0) {
      rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted (empty)`);
    }
  }, 30000);
}

// Проверка доступности сервиса для Render и мониторинга.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Socket.IO подключения
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Создание комнаты (ведущий)
  socket.on('create-room', ({ gameId } = {}) => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, {
      gameId: gameId === 'dapoi-hit' ? 'dapoi-hit' : 'brain-ring',
      players: new Map(),
      hosts: new Set(),
      lastWinnerName: null,
      lockedUntil: 0,
      cleanupTimeout: null
    });
    socket.emit('room-created', { roomCode });
    console.log(`Room created: ${roomCode} by ${socket.id}`);
  });

  // Присоединение к комнате (участник или ведущий)
  socket.on('join-room', ({ roomCode, role, name }) => {
    if (!rooms.has(roomCode)) {
      socket.emit('room-error', { message: 'Комната не найдена' });
      return;
    }

    const room = rooms.get(roomCode);
    if (room.cleanupTimeout) {
      clearTimeout(room.cleanupTimeout);
      room.cleanupTimeout = null;
    }
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.role = role;

    if (role === 'player' && name) {
      // Добавляем игрока в комнату
      room.players.set(socket.id, name);
      socket.data.playerName = name;
      console.log(`Player ${name} (${socket.id}) joined room ${roomCode}`);
    } else if (role === 'host') {
      // Host не добавляется в players, но получает обновления
      room.hosts.add(socket.id);
      console.log(`Host (${socket.id}) joined room ${roomCode}`);
    }

    socket.emit('room-joined', { roomCode, gameId: room.gameId });
    
    // Отправляем обновление состояния комнаты
    sendRoomUpdate(roomCode);
  });

  // Нажатие кнопки
  socket.on('buzz', ({ roomCode, name }) => {
    if (!roomCode || !rooms.has(roomCode)) {
      return;
    }

    const room = rooms.get(roomCode);
    
    // Если комната уже заблокирована, игнорируем
    if (room.lockedUntil > Date.now()) {
      return;
    }

    // Устанавливаем победителя и блокируем комнату
    room.lastWinnerName = name;
    room.lockedUntil = Date.now() + 3000;

    console.log(`Winner: ${name} (${socket.id}) in room ${roomCode}`);

    // Отправляем обновление с locked=true
    sendRoomUpdate(roomCode);

    // Автоматическая разблокировка через 1 секунду
    setTimeout(() => {
      room.lockedUntil = 0;
      sendRoomUpdate(roomCode);
      console.log(`Room ${roomCode} unlocked`);
    }, 3000);
  });

  // Отключение
  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode && rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      
      // Если это был игрок, удаляем из players
      if (socket.data.role === 'player' && room.players.has(socket.id)) {
        room.players.delete(socket.id);
        console.log(`Player ${socket.id} left room ${roomCode}`);
        
        // Отправляем обновление после удаления игрока
        sendRoomUpdate(roomCode);
      }
      
      if (socket.data.role === 'host') {
        room.hosts.delete(socket.id);
      }

      scheduleRoomCleanup(roomCode);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

