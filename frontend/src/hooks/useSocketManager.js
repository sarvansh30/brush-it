// useSocketManager.js
import { useEffect, useRef } from 'react';

export const useSocketManager = (socketCtx, roomid, callbacks) => {
  const { socket } = socketCtx || {};
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!socket || !roomid) return;

    const onConnect = () => {

      setTimeout(() => {
        if (socket.connected && socket.id) {
          console.log(`[CLIENT] Connected (id=${socket.id}). Joining room ${roomid}`);
          socket.emit('JOIN_ROOM', roomid);

          const handleCanvasHistory = (data) => callbacksRef.current?.onCanvasHistory?.(data);
          const handleDrawAction = (data) => callbacksRef.current?.onDrawAction?.(data);
          const handleCanvasReset = () => callbacksRef.current?.onCanvasReset?.();
          const handleCreateSnapshot = (data) => callbacksRef.current?.onCreateSnapshot?.(data);

          socket.on('CANVAS_HISTORY', handleCanvasHistory);
          socket.on('DRAW_ACTION', handleDrawAction);
          socket.on('CANVAS_RESET', handleCanvasReset);
          socket.on('CREATE_SNAPSHOT', handleCreateSnapshot);

          socket._customHandlers = {
            handleCanvasHistory,
            handleDrawAction,
            handleCanvasReset,
            handleCreateSnapshot
          };
        } else {
          console.log('⚠️ Connection not fully ready, retrying...');
 
          setTimeout(() => {
            if (socket.connected && socket.id) {
              onConnect();
            }
          }, 100);
        }
      }, 50); 
    };


    socket.on('connect', onConnect);

    if (socket.connected && socket.id) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      
      if (socket._customHandlers) {
        socket.off('CANVAS_HISTORY', socket._customHandlers.handleCanvasHistory);
        socket.off('DRAW_ACTION', socket._customHandlers.handleDrawAction);
        socket.off('CANVAS_RESET', socket._customHandlers.handleCanvasReset);
        socket.off('CREATE_SNAPSHOT', socket._customHandlers.handleCreateSnapshot);
        delete socket._customHandlers;
      }
    };
  }, [socket, roomid]);
};

