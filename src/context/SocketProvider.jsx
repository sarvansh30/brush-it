import { useEffect, useState } from 'react';
import {io} from 'socket.io-client';
import { SocketContext } from './SocketContext';

export const SocketProvider = ({children})=>{
    const [socket, setSocket] = useState(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

    useEffect(()=>{
       const socket  = io(BACKEND_URL); 
       setSocket(socket);

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