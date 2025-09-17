// useSocketManager.js
import { useEffect, useRef, useCallback } from 'react';

export const useSocketManager = (socketCtx, roomid, callbacks) => {
  const { socket, isConnected } = socketCtx || {};
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!socket || !roomid) return;

    if (isConnected) {
      console.log(`%c[CLIENT] EMITTING JOIN_ROOM EVENT. Room: ${roomid}`, 'color: #00A36C; font-weight: bold;');

      socket.emit('JOIN_ROOM', roomid);
    } else {
      console.log(`[CLIENT] Socket not connected. Current status: ${isConnected}`);
    }


    return () => {
      if (socket) {
        console.log(`[SocketManager] 🚪 Cleaning up room-join listeners. Leaving room: ${roomid}`);

      }
    };
  }, [socket, roomid, isConnected]);

  useEffect(() => {
    if (!socket) return;

    const handleCanvasHistory = (data) => {
      console.log('✅ Received CANVAS_HISTORY, dispatching to reducer.');
      callbacksRef.current?.onCanvasHistory?.(data);
    };
    const handleDrawAction = (data) => callbacksRef.current?.onDrawAction?.(data);
    const handleCanvasReset = () => callbacksRef.current?.onCanvasReset?.();
    const handleCreateSnapshot = (data) => callbacksRef.current?.onCreateSnapshot?.(data);
    
    socket.on('CANVAS_HISTORY', handleCanvasHistory);
    socket.on('DRAW_ACTION', handleDrawAction);
    socket.on('CANVAS_RESET', handleCanvasReset);
    socket.on('CREATE_SNAPSHOT', handleCreateSnapshot);

    console.log('[SocketManager] Event listeners attached for socket:', socket.id);
    
    return () => {
      socket.off('CANVAS_HISTORY', handleCanvasHistory);
      socket.off('DRAW_ACTION', handleDrawAction);
      socket.off('CANVAS_RESET', handleCanvasReset);
      socket.off('CREATE_SNAPSHOT', handleCreateSnapshot);
      console.log('[SocketManager] Event listeners removed for socket:', socket.id);
    };
  }, [socket]);
};