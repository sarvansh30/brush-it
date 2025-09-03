import { useEffect } from "react";
export const socketJoinRoom = (socket, roomid) => {
    useEffect(() => {
                if (!socket || !roomid) return;
        
                console.log(`Socket emitting JOIN_ROOM for room: ${roomid}`);
                socket.emit("JOIN_ROOM", roomid);
        
                return () => {
                    console.log(`Socket emitting LEAVE_ROOM for room: ${roomid}`);
                };
            }, [socket, roomid]); }