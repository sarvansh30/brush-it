import { useEffect } from 'react';

export const useSocketManager = (socket, roomid, callbacks) => {
    useEffect(() => {
        if (!socket || !roomid) return;

        // Join room when component mounts
        // socket.emit("JOIN_ROOM", roomid);

        const {
            onCanvasHistory,
            onDrawAction,
            onCanvasReset,
            onCreateSnapshot
        } = callbacks;

        // Set up socket listeners
        socket.on('CANVAS_HISTORY', onCanvasHistory);
        socket.on('DRAW_ACTION', onDrawAction);
        socket.on('CANVAS_RESET', onCanvasReset);
        socket.on('CREATE_SNAPSHOT', onCreateSnapshot);

        // Cleanup listeners
        return () => {
            socket.off('CANVAS_HISTORY');
            socket.off('DRAW_ACTION');
            socket.off('CANVAS_RESET');
            socket.off('CREATE_SNAPSHOT');
        };
    }, [socket, roomid, callbacks]);
};