import React, { useState, useRef, useContext, useEffect, useCallback } from "react";
import { ToolContext } from "../context/ToolContext";
import { SocketContext } from "../context/SocketContext";
import { useParams } from "react-router-dom";
import { useDrawing } from "../hooks/useDrawing";
import { useSocketManager } from "../hooks/useSocketManager";
import { canvasUtils } from "../utils/canvasUtils";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

const DrawingBoard = () => {
  const { toolOptions } = useContext(ToolContext);
  const { color, strokeWidth } = toolOptions;
  
  const socketContext = useContext(SocketContext);
  const { roomid } = useParams();

  if (!socketContext) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg">Connecting to server...</div>
      </div>
    );
  }
  
  const { socket, isConnected } = socketContext;
  
  const canvasRef = useRef(null);
  // ✅ ADDED: State to track if the canvas is initialized
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false); 
  // ✅ ADDED: Ref to hold history that arrives before initialization
  const pendingHistoryRef = useRef(null); 
  
  const { startDrawing, draw, stopDrawing } = useDrawing(socket, isConnected, roomid, toolOptions);
  
  useKeyboardShortcuts(roomid);

  const socketCallbacks = useCallback({
    // ✅ MODIFIED: This callback now checks if the canvas is ready
    onCanvasHistory: (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isCanvasInitialized) {
        // If canvas is ready, draw immediately
        canvasUtils.loadCanvasHistory(canvas, data.baseImageURL, data.history);
      } else {
        // If canvas is NOT ready, store the data to be drawn later
        pendingHistoryRef.current = data;
      }
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
        // ... your existing onCreateSnapshot logic ...
    }
  }, [roomid, socket, isConnected, isCanvasInitialized]); // ✅ MODIFIED: Added dependency

  useSocketManager({ socket, isConnected }, roomid, socketCallbacks);

  // ✅ MODIFIED: This useEffect now signals when initialization is complete
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvasUtils.initializeCanvas(canvas, color, strokeWidth);
    setIsCanvasInitialized(true); // Signal that setup is done
  }, []); 

  // ✅ ADDED: This new useEffect draws any pending history once the canvas is ready
  useEffect(() => {
    if (isCanvasInitialized && pendingHistoryRef.current) {
        const canvas = canvasRef.current;
        const data = pendingHistoryRef.current;
        if (canvas && data) {
            console.log("Drawing pending history...");
            canvasUtils.loadCanvasHistory(canvas, data.baseImageURL, data.history);
            pendingHistoryRef.current = null; // Clear the pending data
        }
    }
  }, [isCanvasInitialized]);

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