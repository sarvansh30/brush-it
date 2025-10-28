import React, {
  useContext,
  useRef,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import { ToolContext } from "../context/ToolContext";
import { useDrawing } from "../hooks/useDrawing";
import { canvasUtils } from "../utils/canvasUtils";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useSocketManager } from "../hooks/useSocketManager";
import { SocketContext } from "../context/SocketContext";

// Loading states enum
const LoadingStates = {
  CONNECTING: "connecting",
  LOADING_CANVAS_DATA: "loading_canvas_data",
  INITIALIZING_CANVAS: "initializing_canvas",
  LOADING_HISTORY: "loading_history",
  READY: "ready",
  ERROR: "error",
};

// ✅ FIXED: Initial state tracks if canvas is initialized
const initialState = {
  status: LoadingStates.CONNECTING,
  error: null,
  width: null,
  height: null,
  history: null,
  isInitialized: false, // ✅ NEW: Track if canvas has been set up
};

// ✅ FIXED: Reducer handles both initial load and updates
function reducer(state, action) {
  switch (action.type) {
    case "CANVAS_DATA_RECEIVED":
      console.log("🔄 Reducer: CANVAS_DATA_RECEIVED", {
        isInitialized: state.isInitialized,
        hasPayload: !!action.payload
      });
      
      // ✅ If canvas already initialized, just update history without re-initializing
      if (state.isInitialized) {
        console.log("♻️ Canvas already initialized, updating history only");
        return {
          ...state,
          history: {
            baseImageURL: action.payload.baseImageURL,
            history: action.payload.history,
          },
          // Status stays READY, no re-initialization
        };
      }
      
      // ✅ First time initialization
      console.log("🆕 First time initialization");
      return {
        ...state,
        status: LoadingStates.INITIALIZING_CANVAS,
        width: action.payload.width,
        height: action.payload.height,
        history: {
          baseImageURL: action.payload.baseImageURL,
          history: action.payload.history,
        },
      };

    case "CANVAS_INITIALIZED":
      console.log("✅ Reducer: CANVAS_INITIALIZED");
      return { 
        ...state, 
        status: LoadingStates.LOADING_HISTORY,
        // ✅ Don't set isInitialized here - wait until history loads
      };

    case "HISTORY_LOADED":
      console.log("✅ Reducer: HISTORY_LOADED");
      return { 
        ...state, 
        status: LoadingStates.READY,
        isInitialized: true // ✅ Set AFTER initial history loads
      };

    case "HISTORY_UPDATED":
      console.log("♻️ Reducer: HISTORY_UPDATED (live update)");
      return { ...state }; // Just trigger re-render

    case "ERROR":
      console.error("❌ Reducer: ERROR", action.payload);
      return { ...state, status: LoadingStates.ERROR, error: action.payload };

    case "RETRY":
      console.log("🔄 Reducer: RETRY");
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
    socketCtx.socket,
    state.status === LoadingStates.READY,
    roomid,
    toolOptions
  );
  useKeyboardShortcuts(roomid);

  // Socket callbacks
  const socketCallbacks = useCallback({
    onCanvasHistory: (data) => {
      console.log('📥 [CANVAS_HISTORY] Received:', {
        isUpdate: state.isInitialized,
        historyLength: data.history?.length
      });
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
  }, [roomid, socketCtx.socket, socketCtx.isConnected, state.isInitialized]);
  
  useSocketManager(socketCtx, roomid, socketCallbacks);

  // ✅ Canvas initialization - ONLY runs on first load
  useEffect(() => {
    console.log("=== Canvas Initialization Effect ===");
    console.log("Status:", state.status);
    console.log("Width:", state.width, "Height:", state.height);
    console.log("Canvas ref exists:", !!canvasRef.current);
    console.log("Is initialized:", state.isInitialized);

    // ✅ Skip if already initialized
    if (state.isInitialized) {
      console.log("⏭️ Canvas already initialized, skipping");
      return;
    }

    if (
      state.status !== LoadingStates.INITIALIZING_CANVAS || 
      !state.width || 
      !state.height || 
      !canvasRef.current
    ) {
      console.log("⏭️ Early return - conditions not met");
      return;
    }

    const canvas = canvasRef.current;
    
    try {
      console.log('🎨 Initializing canvas with size:', state.width, 'x', state.height);
      canvasUtils.initializeCanvas(
        canvas,
        color,
        strokeWidth,
        state.width,
        state.height
      );
      console.log('✅ Canvas initialized successfully');
      dispatch({ type: "CANVAS_INITIALIZED" });
    } catch (err) {
      console.error("❌ Canvas initialization error:", err);
      dispatch({ type: "ERROR", payload: `Failed to initialize canvas: ${err.message}` });
    }
  }, [state.status, state.width, state.height, state.isInitialized, color, strokeWidth]);

  // ✅ Load history - handles BOTH initial load and updates
  useEffect(() => {
    console.log("=== History Loading Effect ===");
    console.log("Status:", state.status);
    console.log("Is initialized:", state.isInitialized);
    console.log("History exists:", !!state.history);

    if (!state.history) {
      console.log("⏭️ No history data yet");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("❌ Canvas not available");
      return;
    }

    // ✅ Handle initial history load (during setup - isInitialized is still false)
    if (state.status === LoadingStates.LOADING_HISTORY && !state.isInitialized) {
      console.log("🖼️ Initial history load...");
      
      const loadInitialHistory = async () => {
        console.log("Loading initial history:", {
          historyLength: state.history.history?.length || 0,
          hasBaseImage: !!state.history.baseImageURL,
          canvasDimensions: `${state.width}x${state.height}`
        });

        try {
          await canvasUtils.loadCanvasHistory(
            canvas,
            state.history.baseImageURL,
            state.history.history,
            state.width,
            state.height
          );
          console.log("✅ Initial history loaded successfully");
          dispatch({ type: "HISTORY_LOADED" });
        } catch (err) {
          console.error("❌ History loading error:", err);
          dispatch({ type: "ERROR", payload: `Failed to load history: ${err.message}` });
        }
      };

      loadInitialHistory();
      return;
    }

    // ✅ Handle history updates (after undo/redo - isInitialized is true, status is READY)
    if (state.isInitialized && state.status === LoadingStates.READY) {
      console.log("♻️ Live history update (undo/redo)...");
      
      const updateHistory = async () => {
        console.log("Updating history:", {
          historyLength: state.history.history?.length || 0,
          hasBaseImage: !!state.history.baseImageURL
        });

        try {
          await canvasUtils.loadCanvasHistory(
            canvas,
            state.history.baseImageURL,
            state.history.history,
            state.width,
            state.height
          );
          console.log("✅ History updated successfully");
          dispatch({ type: "HISTORY_UPDATED" });
        } catch (err) {
          console.error("❌ History update error:", err);
        }
      };

      updateHistory();
    }
  }, [state.status, state.history, state.width, state.height, state.isInitialized]);

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

  // Render
  return (
    <div className="w-screen h-screen bg-neutral-800 flex flex-col items-center justify-center p-4">
      {state.width && state.height && (
        <div className={`flex items-center justify-center ${state.status !== LoadingStates.READY ? 'invisible' : ''}`}>
          <canvas
            ref={canvasRef}
            width={state.width}
            height={state.height}
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