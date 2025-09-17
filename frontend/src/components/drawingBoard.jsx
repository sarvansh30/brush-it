import React, {
  useContext,
  useRef,
  useEffect,
  useReducer,
  useCallback,
  useState,
} from "react";
import { useParams, useLocation } from "react-router-dom";
import { ToolContext } from "../context/ToolContext";
import { useDrawing } from "../hooks/useDrawing";
import { canvasUtils } from "../utils/canvasUtils";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useSocketManager } from "../hooks/useSocketManager";
import { SocketContext } from "../context/SocketContext";

// Simplified Loading states enum
const LoadingStates = {
  CONNECTING: "connecting",
  LOADING_CANVAS_DATA: "loading_canvas_data",
  INITIALIZING_CANVAS: "initializing_canvas",
  LOADING_HISTORY: "loading_history",
  READY: "ready",
  ERROR: "error",
};

// Reducer initial state
const initialState = {
  status: LoadingStates.CONNECTING,
  error: null,
  canvasSize: null,
  history: null,
};

// Updated Reducer function
function reducer(state, action) {
  switch (action.type) {
    case "CANVAS_DATA_RECEIVED":
      return {
        ...state,
        status: LoadingStates.INITIALIZING_CANVAS,
        canvasSize: { width: action.payload.width, height: action.payload.height },
        history: {
          baseImageURL: action.payload.baseImageURL,
          history: action.payload.history,
          width: action.payload.width,
          height: action.payload.height,
        },
      };

    case "CANVAS_INITIALIZED":
      return { ...state, status: LoadingStates.LOADING_HISTORY };

    case "HISTORY_LOADED":
      return { ...state, status: LoadingStates.READY };

    case "ERROR":
      return { ...state, status: LoadingStates.ERROR, error: action.payload };

    case "RETRY":
      return { ...initialState };

    default:
      return state;
  }
}

// Loading Screen Component
const LoadingScreen = ({ currentState, roomId, error, onRetry }) => {
  const steps = [
    { key: LoadingStates.CONNECTING, label: "Connecting to server", icon: "🔌" },
    { key: LoadingStates.LOADING_CANVAS_DATA, label: "Loading canvas data", icon: "📥" },
    { key: LoadingStates.INITIALIZING_CANVAS, label: "Initializing canvas", icon: "🎨" },
    { key: LoadingStates.LOADING_HISTORY, label: "Loading drawing history", icon: "🖼️" },
  ];

  const getStepStatus = (stepKey) => {
    const stateOrder = Object.values(LoadingStates);
    const currentIndex = stateOrder.indexOf(currentState);
    const stepIndex = stateOrder.indexOf(stepKey);

    if (currentState === LoadingStates.ERROR) {
      return stepIndex < currentIndex ? "completed" : "error";
    }
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Setting up your canvas
          </h2>
          <p className="text-gray-400 text-sm">Room ID: {roomId}</p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const status = getStepStatus(step.key);
            return (
              <div
                key={step.key}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                  status === "active"
                    ? "bg-neutral-800 border border-blue-500"
                    : status === "completed"
                    ? "bg-neutral-800 opacity-75"
                    : status === "error"
                    ? "bg-red-900/20 border border-red-500"
                    : "bg-neutral-800/50 opacity-50"
                }`}
              >
                <div className="flex-shrink-0">
                  {status === "active" ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : status === "completed" ? (
                    <div className="w-8 h-8 flex items-center justify-center text-green-500">
                      ✓
                    </div>
                  ) : status === "error" ? (
                    <div className="w-8 h-8 flex items-center justify-center text-red-500">
                      ✕
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center text-gray-500">
                      <span className="text-xl">{step.icon}</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <p
                    className={`font-medium ${
                      status === "active"
                        ? "text-white"
                        : status === "completed"
                        ? "text-gray-400"
                        : status === "error"
                        ? "text-red-400"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {currentState === LoadingStates.ERROR && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm mb-3">
              {error || "An error occurred while setting up the canvas"}
            </p>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          If the loading takes too long, the backend might be waking up. Please
          wait a moment.
        </div>
      </div>
    </div>
  );
};

const DrawingBoard = () => {
  const { toolOptions } = useContext(ToolContext);
  const { color, strokeWidth } = toolOptions;
  const { roomid } = useParams();
  const canvasRef = useRef(null);
  const socketCtx = useContext(SocketContext);

  const [state, dispatch] = useReducer(reducer, initialState);

  // Drawing hooks
  const { startDrawing, draw, stopDrawing } = useDrawing(
    socketCtx.socket, // Pass socket to useDrawing
    state.status === LoadingStates.READY,
    roomid,
    toolOptions
  );
  useKeyboardShortcuts(roomid);

  // Implement the callbacks using useCallback for stability
  const socketCallbacks = useCallback({
    onCanvasHistory: (data) => {
      console.log('📥 [CANVAS_HISTORY] Received history data, dispatching CANVAS_DATA_RECEIVED.');
      dispatch({ type: "CANVAS_DATA_RECEIVED", payload: data });
    },
    onDrawAction: (data) => {
      console.log('✏️ [DRAW_ACTION] Received draw action.');
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      canvasUtils.drawSegment(context, data);
    },
    onCanvasReset: () => {
      console.log('🧹 [CANVAS_RESET] Received reset signal.');
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvasUtils.clearCanvas(canvas);
    },
    onCreateSnapshot: (data) => {
      console.log('📸 [CREATE_SNAPSHOT] Received snapshot request.');
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('❌ Cannot create snapshot, canvas ref is null.');
        return;
      }
      
      canvasUtils.createSnapshot(canvas, data.baseImageURL, data.strokesToSave, (newSnapshotURL) => {
        console.log('✅ Snapshot creation complete. Emitting SUBMIT_SNAPSHOT.');
        if (socketCtx.socket && socketCtx.isConnected) {
          socketCtx.socket.emit("SUBMIT_SNAPSHOT", {
            roomid: roomid,
            newSnapshotURL: newSnapshotURL,
            strokesToTrim: data.strokesToTrim,
          });
        }
      });
    },
  }, [roomid, socketCtx.socket, socketCtx.isConnected]);
  
  // Pass the new, complete callbacks to useSocketManager
  useSocketManager(socketCtx, roomid, socketCallbacks);


  // Canvas initialization effect - runs when canvas data is received
  useEffect(() => {
    console.log("=== Canvas Initialization Effect ===");
    console.log("state.status:", state.status);
    console.log("state.canvasSize:", state.canvasSize);
    console.log("canvasRef.current:", canvasRef.current);

    if (state.status !== LoadingStates.INITIALIZING_CANVAS || !state.canvasSize || !canvasRef.current) {
      console.log("Early return - conditions not met");
      return;
    }

    const canvas = canvasRef.current;
    
    try {
      console.log('Initializing canvas with size:', state.canvasSize);
      canvasUtils.initializeCanvas(
        canvas,
        color,
        strokeWidth,
        state.canvasSize.width,
        state.canvasSize.height
      );
      console.log('Canvas initialized successfully');
      dispatch({ type: "CANVAS_INITIALIZED" });
    } catch (err) {
      console.error("Canvas initialization error:", err);
      dispatch({ type: "ERROR", payload: `Failed to initialize canvas: ${err.message}` });
    }
  }, [state.status, state.canvasSize, canvasRef.current, color, strokeWidth]);

  // Load history
  useEffect(() => {
    console.log("=== History Loading Effect ===");
    console.log("state.status:", state.status);
    console.log("LoadingStates.LOADING_HISTORY:", LoadingStates.LOADING_HISTORY);
    console.log("state.history:", state.history);
    console.log("canvasRef.current:", canvasRef.current);

    if (state.status !== LoadingStates.LOADING_HISTORY || !state.history) {
      console.log("History loading - early return, conditions not met");
      return;
    }

    const loadHistory = async () => {
      console.log("Starting history loading...");
      
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("❌ Canvas not available for history loading");
        dispatch({ type: "ERROR", payload: "Canvas not available for history loading" });
        return;
      }

      console.log("Canvas available, loading history...", {
        historyLength: state.history.history?.length || 0,
        baseImageURL: !!state.history.baseImageURL,
        canvasSize: { width: canvas.width, height: canvas.height }
      });

      try {
        await canvasUtils.loadCanvasHistory(
          canvas,
          state.history.baseImageURL,
          state.history.history,
          state.history.width,
          state.history.height
        );
        console.log("✅ History loaded successfully");
        dispatch({ type: "HISTORY_LOADED" });
      } catch (err) {
        console.error("❌ History loading error:", err);
        dispatch({ type: "ERROR", payload: `Failed to load history: ${err.message}` });
      }
    };

    loadHistory();
  }, [state.status, state.history]);

  // Update canvas properties on tool change
  useEffect(() => {
    if (state.status !== LoadingStates.READY) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvasUtils.updateCanvasProperties(ctx, color, strokeWidth);
  }, [color, strokeWidth, state.status]);

  // Retry handler
  const handleRetry = () => dispatch({ type: "RETRY" });

  // Drawing events
  const handleMouseDown = (e) => {
    if (state.status !== LoadingStates.READY) return;
    const ctx = canvasRef.current.getContext("2d");
    startDrawing(ctx, e);
  };

  const handleMouseMove = (e) => {
    if (state.status !== LoadingStates.READY) return;
    const ctx = canvasRef.current.getContext("2d");
    draw(ctx, e);
  };

  const handleMouseUp = () => {
    if (state.status === LoadingStates.READY) stopDrawing();
  };

  const handleMouseLeave = () => {
    if (state.status === LoadingStates.READY) stopDrawing();
  };

  // Render the component
  return (
    <div className="w-screen h-screen bg-neutral-800 flex flex-col items-center justify-center p-4">
      {state.canvasSize && (
        <div className={`flex items-center justify-center ${state.status !== LoadingStates.READY ? 'invisible' : ''}`}>
          <canvas
            ref={canvasRef}
            width={state.canvasSize.width}
            height={state.canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair bg-white rounded-md shadow-lg"
          />
        </div>
      )}

      {state.status !== LoadingStates.READY && (
        <LoadingScreen
          currentState={state.status}
          roomId={roomid}
          error={state.error}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};

export default DrawingBoard;