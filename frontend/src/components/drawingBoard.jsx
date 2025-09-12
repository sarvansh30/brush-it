import { useContext, useRef, useEffect, useCallback, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { ToolContext } from "../context/ToolContext";
import { SocketContext } from "../context/SocketContext";
import { useDrawing } from "../hooks/useDrawing";
import { useSocketManager } from "../hooks/useSocketManager";
import { canvasUtils } from "../utils/canvasUtils";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

const DrawingBoard = () => {
  const { toolOptions } = useContext(ToolContext);
  const { color, strokeWidth } = toolOptions;
  
  const socketContext = useContext(SocketContext);
  const { roomid } = useParams();
  const location = useLocation(); // Get location object
  const canvasRef = useRef(null);

  // Initialize canvas size from navigation state if available (for room creator)
  const [canvasSize, setCanvasSize] = useState(location.state ? {
    width: location.state.width,
    height: location.state.height
  } : null);

  if (!socketContext) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg">Connecting to server...</div>
      </div>
    );
  }
  
  const { socket, isConnected } = socketContext;
  
  const { startDrawing, draw, stopDrawing } = useDrawing(socket, isConnected, roomid, toolOptions);
  
  useKeyboardShortcuts(roomid);

  const socketCallbacks = useCallback({
    onCanvasHistory: (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas size from server data and load history
      setCanvasSize({ width: data.width, height: data.height });
      canvasUtils.loadCanvasHistory(canvas, data.baseImageURL, data.history, data.width, data.height);
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
        // When a snapshot request is received, create it and submit back
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvasUtils.createSnapshot(canvas, data.baseImageURL, data.strokesToSave, (newSnapshotURL) => {
            if (socket && isConnected) {
                socket.emit("SUBMIT_SNAPSHOT", {
                    roomid: roomid,
                    newSnapshotURL: newSnapshotURL,
                    strokesToTrim: data.strokesToTrim,
                });
            }
        });
    }
  }, [roomid, socket, isConnected]);

  // The hook now handles joining the room automatically on connection
  useSocketManager({ socket, isConnected }, roomid, socketCallbacks);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasSize) return; // Wait for canvas and size
    
    // Initialize properties once size is known
    canvasUtils.initializeCanvas(canvas, color, strokeWidth,1200,800);
  }, [canvasSize]); 

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
    <div className="w-full h-full bg-neutral-800 flex items-center justify-center p-4">
      {!isConnected && (
        <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded z-10">
          Reconnecting...
        </div>
      )}
      {canvasSize ? (
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair bg-white rounded-md shadow-lg"
        />
      ) : (
        <div className="text-white text-lg">Loading Canvas...</div>
      )}
    </div>
  );
};

export default DrawingBoard;