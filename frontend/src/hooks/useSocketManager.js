// useSocketManager.js
import { useEffect, useRef } from 'react';

export const useSocketManager = (socketCtx, roomid, callbacks) => {
  const { socket } = socketCtx || {};
  
  // Use a ref to hold the latest callbacks without re-triggering the effect
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    // Exit if we don't have the necessary variables
    if (!socket || !roomid) return;

    // --- 1. Define Handlers ---
    // This function will run when the socket successfully connects.
    const onConnect = () => {
      console.log(`%c✅ SOCKET CONNECTED. Emitting JOIN_ROOM for room: ${roomid}`, 'color: #00A36C; font-weight: bold;');
      socket.emit('JOIN_ROOM', roomid);
    };

    // Define handlers for your custom events
    const onCanvasHistory = (data) => callbacksRef.current?.onCanvasHistory?.(data);
    const onDrawAction = (data) => callbacksRef.current?.onDrawAction?.(data);
    const onCanvasReset = () => callbacksRef.current?.onCanvasReset?.();
    const onCreateSnapshot = (data) => callbacksRef.current?.onCreateSnapshot?.(data);

    // --- 2. Attach All Event Listeners Once ---
    socket.on('connect', onConnect);
    socket.on('CANVAS_HISTORY', onCanvasHistory);
    socket.on('DRAW_ACTION', onDrawAction);
    socket.on('CANVAS_RESET', onCanvasReset);
    socket.on('CREATE_SNAPSHOT', onCreateSnapshot);
    console.log('[SocketManager] All event listeners attached.');

    // --- 3. Handle Already-Connected Sockets ---
    // If the socket is already connected when this component mounts,
    // the 'connect' event won't fire, so we manually call the handler.
    if (socket.connected) {
      onConnect();
    }

    // --- 4. Define Cleanup Logic ---
    // This function runs ONLY when the component unmounts for good.
    return () => {
      console.log(`[SocketManager] 🚪 Unmounting. Cleaning up all listeners and leaving room: ${roomid}`);
      
      // Notify the backend that the user is leaving
      // socket.emit('LEAVE_ROOM', roomid);
      
      // Detach all listeners to prevent memory leaks
      socket.off('connect', onConnect);
      socket.off('CANVAS_HISTORY', onCanvasHistory);
      socket.off('DRAW_ACTION', onDrawAction);
      socket.off('CANVAS_RESET', onCanvasReset);
      socket.off('CREATE_SNAPSHOT', onCreateSnapshot);
    };

  // This effect ONLY depends on the socket instance and room ID.
  // It will NOT re-run when connection status changes.
  }, [socket.connected, roomid]); 
};