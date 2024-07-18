import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (routePrefix: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!routePrefix) return; // Don't connect if routePrefix is not available yet

    console.log('Connecting to Telescope server with', routePrefix);
    const newSocket = io('http://localhost:4000', {
      path: `${routePrefix}/socket.io`,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to Telescope server');
    });

    newSocket.on('connect_error', error => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [routePrefix]);

  return socket;
};
