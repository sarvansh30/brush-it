import React, { useRef, useContext, useEffect, useCallback } from "react";
import { ToolContext } from "../context/ToolContext";
import { SocketContext } from "../context/SocketContext";
import { useParams } from "react-router-dom";
import { useDrawing } from "../hooks/useDrawing";
import { useSocketManager } from "../hooks/useSocketManager";
import { canvasUtils } from "../utils/canvasUtils";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

const DrawingBoard = () => {
   console.log("1. DrawingBoard component rendered.");

  const { toolOptions } = useContext(ToolContext);
  const { color, strokeWidth } = toolOptions;
  
  const socketContext = useContext(SocketContext);
  const { roomid } = useParams();
  console.log("2. Socket Context is:", socketContext);
  // Early return while context is initializing
  if (!socketContext) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg">Connecting to server...</div>
      </div>
    );
  }
  
  const { socket, isConnected } = socketContext;
  
  const canvasRef = useRef(null);
   
  // 🔽 Pass 'isConnected' to the useDrawing hook
  const { startDrawing, draw, stopDrawing } = useDrawing(socket, isConnected, roomid, toolOptions);
  
  useKeyboardShortcuts(roomid);

  const socketCallbacks = useCallback({
    onCanvasHistory: (data) => {
      const { baseImageURL, history } = data;
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvasUtils.loadCanvasHistory(canvas, baseImageURL, history);
    },
    onDrawAction: (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext("2d");
      canvasUtils.drawSegment(context, data);
    },
    onCanvasReset: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvasUtils.clearCanvas(canvas);
    },
    onCreateSnapshot: (data) => {
      const { baseImageURL, strokesToSave } = data;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvasUtils.createSnapshot(
        canvas, 
        baseImageURL, 
        strokesToSave, 
        (newSnapshotURL) => {
          // Check connection before emitting back
          if (socket && isConnected) {
            socket.emit('SUBMIT_SNAPSHOT', { 
              roomid: roomid, 
              newSnapshotURL: newSnapshotURL 
            });
          }
        }
      );
    }
  }, [roomid, socket, isConnected]); 

  useSocketManager({ socket, isConnected }, roomid, socketCallbacks);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvasUtils.initializeCanvas(canvas, color, strokeWidth);
  }, []); // Initialize only once on mount

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    canvasUtils.updateCanvasProperties(context, color, strokeWidth);
  }, [color, strokeWidth]);

  const handleMouseDown = (e) => {
   
    if (!isConnected) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    startDrawing(context, e);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    draw(context, e);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleMouseLeave = () => {
    stopDrawing();
  };

  return (
    <div className="w-full h-full">
      {!isConnected && (
        <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded z-10">
          Reconnecting...
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
      />
    </div>
  );
};

export default DrawingBoard;