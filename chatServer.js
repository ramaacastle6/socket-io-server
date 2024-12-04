// chatServer.js

const io = require('socket.io')(process.env.PORT || 3000, {
  cors: {
    origin: '*', // En producción, especifica el origen permitido
    methods: ['GET', 'POST'],
  },
});

let onlineUsers = {}; // Mapa de usuarios en línea: userId => socket.id

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado:', socket.id);

  // Manejar evento 'userOnline'
  socket.on('userOnline', ({ userId }) => {
    onlineUsers[userId] = socket.id;
    console.log(`Usuario en línea: ${userId}, Socket ID: ${socket.id}`);

    // Emitir 'userOnlineStatus' a todos excepto al usuario conectado
    socket.broadcast.emit('userOnlineStatus', { userId, isOnline: true, lastSeen: null });
  });

  // Manejar evento 'userOffline'
  socket.on('userOffline', ({ userId }) => {
    if (onlineUsers[userId]) {
      delete onlineUsers[userId];
      const lastSeen = new Date().toISOString();
      console.log(`Usuario desconectado: ${userId}, LastSeen: ${lastSeen}`);

      // Emitir 'userOnlineStatus' a todos excepto al usuario desconectado
      socket.broadcast.emit('userOnlineStatus', { userId, isOnline: false, lastSeen });
    }
  });

  // Manejar evento 'typing'
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    // Emitir 'userTyping' a todos en la sala de chat excepto al emisor
    socket.to(chatId).emit('userTyping', { userId, isTyping });
    console.log(`Usuario ${userId} está ${isTyping ? 'escribiendo...' : 'dejando de escribir.'}`);
  });

  // Manejar evento 'joinChat'
  socket.on('joinChat', ({ chatId, userId }) => {
    socket.join(chatId);
    console.log(`Usuario ${userId} se unió al chat ${chatId}`);
  });

  // Manejar evento 'leaveChat'
  socket.on('leaveChat', ({ chatId, userId }) => {
    socket.leave(chatId);
    console.log(`Usuario ${userId} salió del chat ${chatId}`);
  });

  // Manejar evento 'requestUserOnlineStatus'
  socket.on('requestUserOnlineStatus', ({ userId }) => {
    const isOnline = !!onlineUsers[userId];
    const lastSeen = isOnline ? null : new Date().toISOString(); // Puedes ajustar esto según tu lógica
    socket.emit('userOnlineStatus', { userId, isOnline, lastSeen });
    console.log(`Respondido 'userOnlineStatus' para userId: ${userId}, isOnline: ${isOnline}`);
  });

  // Manejar evento 'disconnect'
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    const userId = Object.keys(onlineUsers).find((key) => onlineUsers[key] === socket.id);
    if (userId) {
      delete onlineUsers[userId];
      const lastSeen = new Date().toISOString();
      console.log(`Usuario desconectado (por disconnect): ${userId}, LastSeen: ${lastSeen}`);

      // Emitir 'userOnlineStatus' a todos excepto al usuario desconectado
      socket.broadcast.emit('userOnlineStatus', { userId, isOnline: false, lastSeen });
    }
  });
});

const PORT = process.env.PORT || 3000;
io.listen(PORT);
console.log(`Servidor Socket.io escuchando en puerto ${PORT}`);