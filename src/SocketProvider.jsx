import { useEffect, useState } from 'react';
import {io} from 'socket.io-client';
import { SocketContext } from './SocketContext';

export const SocketProvider = ({children})=>{
    const [socket, setSocket] = useState(null);

    useEffect(()=>{
       const socket  = io('http://localhost:3000'); 
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