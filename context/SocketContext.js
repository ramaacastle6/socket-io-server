// context/SocketContext.js

import React from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://192.168.0.121:3000'; // Reemplaza con la IP de tu servidor

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  jsonp: false,
});

export const SocketContext = React.createContext();
