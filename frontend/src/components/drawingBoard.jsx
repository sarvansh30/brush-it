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
  const location = useLocation();
  const canvasRef = useRef(null);

  // Debug states
  const [debugInfo, setDebugInfo] = useState({
    socketConnected: false,
    roomJoined: false,
    canvasHistoryReceived: false,
    canvasInitialized: false,
    canvasHistoryLoaded: false
  });

  // Initialize canvas size from navigation state if available (for room creator)
  const [canvasSize, setCanvasSize] = useState(location.state ? {
    width: location.state.width,
    height: location.state.height
  } : null);

  const [isWaitingForCanvasData, setIsWaitingForCanvasData] = useState(false);

  // Log component mount
  useEffect(() => {
    console.log('🚀 DrawingBoard component mounted with:', {
      roomid,
      hasLocationState: !!location.state,
      locationState: location.state,
      socketContext: !!socketContext
    });
  }, []);

  if (!socketContext) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg">Connecting to server...</div>
      </div>
    );
  }
  
  const { socket, isConnected } = socketContext;
  
  // Update debug info when connection changes
  useEffect(() => {
    console.log('🔌 Socket connection changed:', { isConnected, socketId: socket?.id });
    setDebugInfo(prev => ({ ...prev, socketConnected: isConnected }));
  }, [isConnected, socket?.id]);

  const { startDrawing, draw, stopDrawing } = useDrawing(socket, isConnected, roomid, toolOptions);
  
  useKeyboardShortcuts(roomid);

  // Stable callback functions with extensive logging
  const socketCallbacks = useCallback({
    onCanvasHistory: (data) => {
      console.log('📥 [CANVAS_HISTORY] Received:', {
        baseImageURL: !!data.baseImageURL,
        historyLength: data.history?.length || 0,
        width: data.width,
        height: data.height,
        data: data
      });
      
      setDebugInfo(prev => ({ ...prev, canvasHistoryReceived: true }));
      
      // Set canvas size first
      console.log('🖼️ [CANVAS_HISTORY] Setting canvas size:', { width: data.width, height: data.height });
      setCanvasSize({ width: data.width, height: data.height });
      setIsWaitingForCanvasData(false);
      
      // Wait for canvas to be ready and load history
      const loadHistoryWhenReady = () => {
        const canvas = canvasRef.current;
        console.log('🔍 [CANVAS_HISTORY] Checking canvas readiness:', {
          canvasExists: !!canvas,
          canvasWidth: canvas?.width,
          canvasHeight: canvas?.height,
          expectedWidth: data.width,
          expectedHeight: data.height
        });
        
        if (!canvas || canvas.width !== data.width || canvas.height !== data.height) {
          console.log('⏳ [CANVAS_HISTORY] Canvas not ready, retrying in 50ms...');
          setTimeout(loadHistoryWhenReady, 50);
          return;
        }
        
        console.log('✅ [CANVAS_HISTORY] Canvas ready, loading history...');
        try {
          canvasUtils.loadCanvasHistory(canvas, data.baseImageURL, data.history, data.width, data.height);
          setDebugInfo(prev => ({ ...prev, canvasHistoryLoaded: true }));
          console.log('🎉 [CANVAS_HISTORY] History loaded successfully!');
        } catch (error) {
          console.error('❌ [CANVAS_HISTORY] Error loading history:', error);
        }
      };
      
      setTimeout(loadHistoryWhenReady, 10);
    },
    onDrawAction: (data) => {
      console.log('✏️ [DRAW_ACTION] Received:', data);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      canvasUtils.drawSegment(context, data);
    },
    onCanvasReset: () => {
      console.log('🧹 [CANVAS_RESET] Received');
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvasUtils.clearCanvas(canvas);
    },
    onCreateSnapshot: (data) => {
      console.log('📸 [CREATE_SNAPSHOT] Received:', data);
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvasUtils.createSnapshot(canvas, data.baseImageURL, data.strokesToSave, (newSnapshotURL) => {
        console.log("reached onCOmplete callback");
        console.log(socket);
        console.log(isConnected);
        if (socket && isConnected) {
          console.log("reached onCOmplete callback, 7777");
          socket.emit("SUBMIT_SNAPSHOT", {
            roomid: roomid,
            newSnapshotURL: newSnapshotURL,
            strokesToTrim: data.strokesToTrim,
          });
        }
      });
    }
  }, [socket, isConnected, roomid]);

  // Track when we're waiting for canvas data
  useEffect(() => {
    if (isConnected && !canvasSize && !debugInfo.canvasHistoryReceived) {
      console.log('🔄 Connected but no canvas data yet, waiting...');
      setIsWaitingForCanvasData(true);
    }
  }, [isConnected, canvasSize, debugInfo.canvasHistoryReceived]);

  // Enhanced useSocketManager with room join tracking
  const originalUseSocketManager = useSocketManager({ socket, isConnected }, roomid, socketCallbacks);
  

  // Canvas initialization with enhanced logging
  useEffect(() => {
    const canvas = canvasRef.current;
    console.log('🎨 [CANVAS_INIT] Effect running:', {
      canvasExists: !!canvas,
      canvasSize,
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height
    });
    
    if (!canvas || !canvasSize) {
      console.log('⏳ [CANVAS_INIT] Waiting for canvas or canvas size...');
      return;
    }
    
    console.log('🔧 [CANVAS_INIT] Initializing canvas:', canvasSize);
    try {
      canvasUtils.initializeCanvas(canvas, color, strokeWidth, canvasSize.width, canvasSize.height);
      setDebugInfo(prev => ({ ...prev, canvasInitialized: true }));
      console.log('✅ [CANVAS_INIT] Canvas initialized successfully!');
    } catch (error) {
      console.error('❌ [CANVAS_INIT] Error initializing canvas:', error);
    }
  }, [canvasSize, color, strokeWidth]);

  // Update canvas properties when tools change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    canvasUtils.updateCanvasProperties(context, color, strokeWidth);
  }, [color, strokeWidth]);

  // Mouse event handlers
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

  // Enhanced loading messages
  const getLoadingMessage = () => {
    if (!isConnected) {
      return "Connecting to server...";
    }
    if (!debugInfo.roomJoined) {
      return "Joining room...";
    }
    if (!debugInfo.canvasHistoryReceived) {
      return "Loading room data...";
    }
    if (!debugInfo.canvasInitialized) {
      return "Initializing canvas...";
    }
    if (!debugInfo.canvasHistoryLoaded) {
      return "Loading drawings...";
    }
    return "Loading Canvas...";
  };

  return (
    <div className="w-screen h-screen bg-neutral-800 flex flex-col items-center justify-center p-4">
      {!isConnected && (
        <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded z-10">
          Reconnecting...
        </div>
      )}
      
      {/* Debug Panel
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs font-mono z-10">
        <div className="font-bold mb-2">Debug Status:</div>
        <div className={debugInfo.socketConnected ? 'text-green-400' : 'text-red-400'}>
          Socket: {debugInfo.socketConnected ? '✅' : '❌'}
        </div>
        <div className={debugInfo.roomJoined ? 'text-green-400' : 'text-yellow-400'}>
          Room: {debugInfo.roomJoined ? '✅' : '⏳'}
        </div>
        <div className={debugInfo.canvasHistoryReceived ? 'text-green-400' : 'text-yellow-400'}>
          History: {debugInfo.canvasHistoryReceived ? '✅' : '⏳'}
        </div>
        <div className={debugInfo.canvasInitialized ? 'text-green-400' : 'text-yellow-400'}>
          Canvas: {debugInfo.canvasInitialized ? '✅' : '⏳'}
        </div>
        <div className={debugInfo.canvasHistoryLoaded ? 'text-green-400' : 'text-yellow-400'}>
          Loaded: {debugInfo.canvasHistoryLoaded ? '✅' : '⏳'}
        </div>
        <div className="text-gray-400 mt-2">Room: {roomid}</div>
      </div> */}  

      {canvasSize ? (
        <div className="flex items-center justify-center">
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
        </div>
      ) : (
        <div className="text-white text-lg flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div>{getLoadingMessage()}</div>
          <div className="text-sm text-gray-400">Room ID: {roomid}</div>
          {/* <div className="text-xs text-red-400">
            Debug: canvasSize is {canvasSize ? 'SET' : 'NULL'} - {JSON.stringify(canvasSize)}
          </div> */}
        </div>
      )}
    </div>
  );
};

export default DrawingBoard;