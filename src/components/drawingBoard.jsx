import React, { useRef, useState, useEffect, useContext } from "react";
import { ToolContext } from "../ToolContext";
import { SocketContext } from "../SocketContext";
import { useParams } from "react-router-dom";

const DrawingBoard = () => {
  const { tool, color, strokeWidth } = useContext(ToolContext);
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

    socket.on("CANVAS_HISTORY", (historyData) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      historyData.forEach((historyItem) => {
        drawHistory(historyItem);
      });
    });
    socket.on("CANVAS_RESET", () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
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
      socket.emit("DRAW_PATH", {
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
    context.globalCompositeOperation =
      data.tool === "ERASE" ? "destination-out" : "source-over";

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
