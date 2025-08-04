import React, { useRef, useState, useEffect, useContext } from 'react';
import { ToolContext } from '../ToolContext';
import { io } from 'socket.io-client';

const DrawingBoard = () => {
    const { tool, color, strokeWidth } = useContext(ToolContext);
    const canvasRef = useRef(null);
    const socketRef = useRef(null);
    const lastPointRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
    }, [color, strokeWidth]);

    useEffect(() => {
        const socket = io('http://localhost:3000');
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Connected to brush-it backend using socket.io!");
        });

        socket.on('DRAW_ACTION', (data) => {
            drawRemote(data);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const startDrawing = ({ nativeEvent }) => {
        const context = canvasRef.current.getContext('2d');
        const { offsetX, offsetY } = nativeEvent;

        if (tool === 'ERASE') {
            context.globalCompositeOperation = 'destination-out';
        } else {
            context.globalCompositeOperation = 'source-over';
        }

        setIsDrawing(true);
        context.beginPath();
        context.moveTo(offsetX, offsetY);
        lastPointRef.current = { x: offsetX, y: offsetY };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPointRef.current = null;
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;

        const context = canvasRef.current.getContext('2d');
        const { offsetX, offsetY } = nativeEvent;

        context.lineTo(offsetX, offsetY);
        context.stroke();

        if (socketRef.current && lastPointRef.current) {
            socketRef.current.emit('DRAW_ACTION', {
                from: lastPointRef.current,
                to: { x: offsetX, y: offsetY },
                color: color,
                strokeWidth: strokeWidth,
                tool: tool,
            });
        }

        lastPointRef.current = { x: offsetX, y: offsetY };
    };

    const drawRemote = (data) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');                                                                                           

        context.save();
        context.strokeStyle = data.color;
        context.lineWidth = data.strokeWidth;
        context.globalCompositeOperation = data.tool === 'ERASE' ? 'destination-out' : 'source-over';
        context.beginPath();
        context.moveTo(data.from.x, data.from.y);
        context.lineTo(data.to.x, data.to.y);
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