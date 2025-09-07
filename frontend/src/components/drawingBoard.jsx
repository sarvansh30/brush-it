import React, { useRef, useContext, useEffect, useCallback } from "react";
import { ToolContext } from "../context/ToolContext";
import { SocketContext } from "../context/SocketContext";
import { useParams } from "react-router-dom";
import { useDrawing } from "../hooks/useDrawing";
import { useSocketManager } from "../hooks/useSocketManager";
import { canvasUtils } from "../utils/canvasUtils";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";


const DrawingBoard = () => {
  const { toolOptions } = useContext(ToolContext);
  const { tool, color, strokeWidth } = toolOptions;
  const {socket,isSocketReady} = useContext(SocketContext);
  const { roomid } = useParams();
  
  const canvasRef = useRef(null);
   
    const { startDrawing, draw, stopDrawing } = useDrawing(socket, roomid, toolOptions);
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts(roomid);

  // Socket event handlers
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
          socket.emit('SUBMIT_SNAPSHOT', { 
            roomid: roomid, 
            newSnapshotURL: newSnapshotURL 
          });
        }
      );
    }
  }, [roomid]);

 

  useSocketManager(socket, roomid, socketCallbacks);

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvasUtils.initializeCanvas(canvas, color, strokeWidth);
  }, []);

  // Update canvas properties when tool options change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    canvasUtils.updateCanvasProperties(context, color, strokeWidth);
  }, [color, strokeWidth]);

  // Canvas event handlers
  const handleMouseDown = (e) => {
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