import { useEffect } from 'react';

export const useSocketManager = (socket, roomid, callbacks) => {

 
    
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
