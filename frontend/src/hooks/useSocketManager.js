import { useEffect } from 'react';

export const useSocketManager = (socket, roomid, callbacks) => { // Removed isSocketReady

    // Effect for joining the room
    useEffect(() => {
        // The socket is guaranteed to exist here.
        if (!socket || !roomid) return;

        console.log(`🚀 Emitting JOIN_ROOM for room: ${roomid}`);
        socket.emit("JOIN_ROOM", roomid);

        // No cleanup needed for the join event itself
        return () => {
            console.log(`🔌 Leaving room: ${roomid}`);
            // If you had a LEAVE_ROOM event, you'd emit it here.
        };
    }, [socket, roomid]); // Dependency on isSocketReady removed


    // Effect for registering event listeners
    useEffect(() => {
        if (!socket || !callbacks) return;

        const {
            onCanvasHistory,
            onDrawAction,
            onCanvasReset,
            onCreateSnapshot
        } = callbacks;

        socket.on('CANVAS_HISTORY', onCanvasHistory);
        socket.on('DRAW_ACTION', onDrawAction);
        socket.on('CANVAS_RESET', onCanvasReset);
        socket.on('CREATE_SNAPSHOT', onCreateSnapshot);

        return () => {
            socket.off('CANVAS_HISTORY', onCanvasHistory);
            socket.off('DRAW_ACTION', onDrawAction);
            socket.off('CANVAS_RESET', onCanvasReset);
            socket.off('CREATE_SNAPSHOT', onCreateSnapshot);
        };
    }, [socket, callbacks]);
};