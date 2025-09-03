import { useState, useRef } from 'react';

export const useDrawing = (socket, roomid, toolOptions) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const currentPathRef = useRef([]);
    const lastPointRef = useRef(null);

    const startDrawing = (context, { nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;

        // Set drawing mode based on tool
        if (toolOptions.tool === 'ERASER') {
            context.globalCompositeOperation = 'destination-out';
        } else {
            context.globalCompositeOperation = 'source-over';
        }

        setIsDrawing(true);
        currentPathRef.current = [{ x: offsetX, y: offsetY }];

        context.beginPath();
        context.moveTo(offsetX, offsetY);
        lastPointRef.current = { x: offsetX, y: offsetY };
    };

    const draw = (context, { nativeEvent }) => {
        if (!isDrawing) return;
        
        const { offsetX, offsetY } = nativeEvent;

        context.lineTo(offsetX, offsetY);
        context.stroke();

        // Emit real-time drawing action
        if (socket && lastPointRef.current) {
            socket.emit('DRAW_ACTION', {
                roomid: roomid,
                strokeData: {
                    from: lastPointRef.current,
                    to: { x: offsetX, y: offsetY },
                    color: toolOptions.color,
                    strokeWidth: toolOptions.strokeWidth,
                    tool: toolOptions.tool,
                }
            });
        }

        currentPathRef.current.push({ x: offsetX, y: offsetY });
        lastPointRef.current = { x: offsetX, y: offsetY };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        
        // Emit complete stroke data
        if (socket && currentPathRef.current.length > 1) {
            socket.emit("DRAW_STROKE", {
                roomid: roomid, // Fixed: was roomId
                strokeData: {
                    path: currentPathRef.current,
                    tool: toolOptions.tool,
                    color: toolOptions.color,
                    strokeWidth: toolOptions.strokeWidth,
                }
            });
        }
        
        currentPathRef.current = [];
        lastPointRef.current = null;
    };

    return {
        isDrawing,
        startDrawing,
        draw,
        stopDrawing
    };
};