import React, { useRef, useState, useEffect, useContext } from "react";
import { ToolContext } from "../context/ToolContext";
import { SocketContext } from "../context/SocketContext";
import { useParams } from "react-router-dom";

const DrawingBoard = () => {
  const { toolOptions } = useContext(ToolContext);
  const { tool, color, strokeWidth } = toolOptions;
  const socket = useContext(SocketContext);

  const { roomid } = useParams();
  const canvasRef = useRef(null);
  const lastPointRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const pathHistory = useRef([]);

  useEffect(() => {
    if (!socket || !roomid) return;

    socket.emit("JOIN_ROOM", roomid);

    socket.on("DRAW_ACTION", (data) => {
      drawRemote(data);
    });

    socket.on("CANVAS_HISTORY", (data) => {
    const { baseImageURL, history } = data;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    // Always clear the canvas first
    context.clearRect(0, 0, canvas.width, canvas.height);

    // This function will draw the recent strokes
    const drawRecentHistory = () => {
        if (history && history.length > 0) {
            history.forEach((strokeData) => {
                drawHistory(strokeData);
            });
        }
    };

    // Check if there is a base image to draw
    if (baseImageURL) {
        // 1. Create a new Image object
        const image = new Image();
        
        // 2. Define the onload handler BEFORE setting the src
        image.onload = () => {
            // This code only runs AFTER the image is fully loaded
            context.drawImage(image, 0, 0);
            // 4. Now, draw the recent strokes on top of the image
            drawRecentHistory();
        };
        
        // Add an error handler for debugging
        image.onerror = () => {
            console.error("Failed to load base image from URL.");
            // Still draw the history even if the image fails
            drawRecentHistory();
        };

        // 3. Set the image source to start the download
        image.src = baseImageURL;
    } else {
        // If there's no base image, just draw the history on a blank canvas
        drawRecentHistory();
    }
});

    socket.on("CANVAS_RESET", () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on("CREATE_SNAPSHOT", (data) => {
    const { baseImageURL, strokesToSave } = data;

    const offscreenCanvas = document.createElement('canvas');
    const visibleCanvas = canvasRef.current;

    offscreenCanvas.width = visibleCanvas.width;
    offscreenCanvas.height = visibleCanvas.height;

    const ctx = offscreenCanvas.getContext('2d');

    // This function draws the strokes, generates the URL, and sends it back.
    const createImageUrl = () => {
        // Draw the strokes that the server sent.
        strokesToSave.forEach(stroke => drawStrokeOnContext(ctx, stroke));

        // Generate the new image from the hidden canvas's content.
        const newSnapshotURL = offscreenCanvas.toDataURL('image/webp', 0.8);

        // Send the newly created image URL back to the server.
        socket.emit('SUBMIT_SNAPSHOT', { roomid: roomid, newSnapshotURL: newSnapshotURL });
    };

    // If a base image exists, draw it first. Otherwise, just draw the strokes.
    if (baseImageURL) {
        const image = new Image();
        image.src = baseImageURL;
        image.onload = () => {
            // Draw the old snapshot onto the hidden canvas.
            ctx.drawImage(image, 0, 0);
            // Now draw the new strokes on top.
            createImageUrl();
        };
        image.onerror = () => {
            // If the old image fails to load, just draw the strokes anyway.
            createImageUrl();
        };
    } else {
        // If there's no base image, just draw the strokes on a blank canvas.
        createImageUrl();
    }
});

    return () => {
      socket.off("CANVAS_HISTORY");
      socket.off("DRAW_ACTION");
      socket.off("CANVAS_RESET");
    };
  }, [socket, `roomid`]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
  }, [color, strokeWidth]);

  const drawStrokeOnContext = (context, data) => {
        context.save();
        
        context.strokeStyle = data.color;
        context.lineWidth = data.strokeWidth;
        context.lineCap = 'round';
        context.globalCompositeOperation = data.tool === 'ERASE' ? 'destination-out' : 'source-over';
        
        context.beginPath();
        context.moveTo(data.path[0].x, data.path[0].y);

        for (let i = 1; i < data.path.length; i++) {
            context.lineTo(data.path[i].x, data.path[i].y);
        }
        
        context.stroke();
        context.restore();
    };

  const startDrawing = ({ nativeEvent }) => {
    const context = canvasRef.current.getContext("2d");
    const { offsetX, offsetY } = nativeEvent;
    pathHistory.current = [{ x: offsetX, y: offsetY }];

    if (tool === "ERASE") {
      context.globalCompositeOperation = "destination-out";
    } else {
      context.globalCompositeOperation = "source-over";
    }

    setIsDrawing(true);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    lastPointRef.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
    console.log(pathHistory.current);
    if (socket && pathHistory.current.length > 0) {
      socket.emit("DRAW_STROKE", {
        roomid: roomid,
        strokeData: {
          path: pathHistory.current,
          tool: tool,
          color: color,
          strokeWidth: strokeWidth,
        },
      });
    }
    pathHistory.current = [];
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const context = canvasRef.current.getContext("2d");
    const { offsetX, offsetY } = nativeEvent;

    context.lineTo(offsetX, offsetY);
    context.stroke();

    if (socket && lastPointRef.current) {
      socket.emit("DRAW_ACTION", {
        roomid: roomid,
        strokeData: {
          from: lastPointRef.current,
          to: { x: offsetX, y: offsetY },
          color: color,
          strokeWidth: strokeWidth,
          tool: tool,
        },
      });
    }
    pathHistory.current.push({ x: offsetX, y: offsetY });
    lastPointRef.current = { x: offsetX, y: offsetY };
  };

  const drawRemote = (data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    context.save();
    context.strokeStyle = data.color;
    context.lineWidth = data.strokeWidth;
    context.globalCompositeOperation = data.tool === "ERASE" ? "destination-out" : "source-over";

    context.beginPath();
    context.moveTo(data.from.x, data.from.y);
    context.lineTo(data.to.x, data.to.y);
    context.stroke();
    context.restore();
  };

  const drawHistory = (historyData) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.save();
    context.strokeStyle = historyData.color;
    context.lineWidth = historyData.strokeWidth;
    context.globalCompositeOperation =
      historyData.tool === "ERASE" ? "destination-out" : "source-over";

    context.beginPath();
    context.moveTo(historyData.path[0].x, historyData.path[0].y);

    for (let i = 1; i < historyData.path.length; i++) {
      context.lineTo(historyData.path[i].x, historyData.path[i].y);
    }

    context.stroke();
    context.restore();
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default DrawingBoard;
