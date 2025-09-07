import { useEffect, useState, createContext } from 'react';
import { io } from 'socket.io-client';

// 1. Define the socket instance OUTSIDE the component. It's now a singleton.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const socket = io(BACKEND_URL, { autoConnect: false }); // Prevent it from connecting immediately

export const SocketContext = createContext(); // Assuming SocketContext is defined here or imported

export const SocketProvider = ({ children }) => {
    // We no longer need useState for the socket object itself.
    const [isSocketReady, setIsSocketReady] = useState(false);

    useEffect(() => {
        // 2. We now just manage the connection lifecycle, not creation.
        socket.connect();

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setIsSocketReady(true);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected.');
            setIsSocketReady(false);
        });

        // The cleanup function should only disconnect.
        return () => {
            socket.disconnect();
        };
    }, []); // Empty dependency array is correct here.

    // 3. Provide the single, stable socket instance in the context value.
    return (
        <SocketContext.Provider value={{ socket, isSocketReady }}>
            {isSocketReady ? children : <div>Connecting...</div>}
        </SocketContext.Provider>
    );
};