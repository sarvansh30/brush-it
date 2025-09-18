// SocketProvider.jsx
import { useEffect, useState, createContext, useMemo } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from './SocketContext';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";


export const SocketProvider = ({ children }) => {

  const socket = useMemo(() => io(BACKEND_URL, { autoConnect: false }), []);
  const [isConnected, setIsConnected] = useState(socket.connected);


  useEffect(() => {
  
    // const onConnect = () => {
    //   console.log('Socket connected! ✅');
    //   setIsConnected(true);
    // };


    const onDisconnect = () => {
      console.log('Socket disconnected! ❌');
      setIsConnected(false);
    };

    // socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.connect();


    return () => {
      // socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  const contextValue =  { socket, isConnected };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};