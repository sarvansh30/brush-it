// useSocketManager.js
import { useEffect, useRef, useCallback } from 'react';

export const useSocketManager = (socketCtx, roomid, callbacks) => {
  const { socket, isConnected } = socketCtx || {};
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

 useEffect(() => {
  if (!socket || !roomid) return;

  // When the underlying WebSocket connects...
  const onConnect = () => {
    console.log(`[CLIENT] Connected (id=${socket.id}). Joining room ${roomid}`);
    // 1) Join the room
    socket.emit('JOIN_ROOM', roomid);
    // 2) Attach all your callbacks
    socket.on('CANVAS_HISTORY', callbacksRef.current.onCanvasHistory);
    socket.on('DRAW_ACTION',    callbacksRef.current.onDrawAction);
    socket.on('CANVAS_RESET',   callbacksRef.current.onCanvasReset);
    socket.on('CREATE_SNAPSHOT',callbacksRef.current.onCreateSnapshot);
  };

  socket.on('connect', onConnect);

  return () => {
    // Clean up connect listener
    socket.off('connect', onConnect);
    // And tear down any event handlers you attached in onConnect
    socket.off('CANVAS_HISTORY');
    socket.off('DRAW_ACTION');
    socket.off('CANVAS_RESET');
    socket.off('CREATE_SNAPSHOT');
    // Optionally notify server you’re leaving
    // socket.emit('LEAVE_ROOM', roomid);
  };
}, [socket, roomid]);

};