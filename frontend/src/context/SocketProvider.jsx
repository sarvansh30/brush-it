import { useEffect, useState } from 'react';
import {io} from 'socket.io-client';
import { SocketContext } from './SocketContext';
import { useParams } from 'react-router-dom';
export const SocketProvider = ({children})=>{
    const [socket, setSocket] = useState(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const {roomid} = useParams();
    useEffect(()=>{
       const socket  = io(BACKEND_URL); 
       setSocket(socket);
       socket.on('connect',()=>{
        console.log('Socket connected:', socket.id);
        socket.emit('JOIN_ROOM', roomid); // Join a default room or modify as needed
       });

       return ()=>{
        socket.disconnect();
       }
    },[]);

    return (
<SocketContext.Provider value={socket}>
    {children}
</SocketContext.Provider>
    );

};