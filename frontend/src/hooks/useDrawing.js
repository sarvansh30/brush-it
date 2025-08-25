import { color } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const  useDrawing = (socket, roomid, toolOptions) =>{

    const [isDrawing,setIsDrawing] = useState(false);
    const currentPathRef = useRef([]);
    const lastPointRef = useRef(null);

    const startDrawing = (context,{nativeEvent}) =>{
        const {offsetX, offsetY} = nativeEvent;

        if(toolOptions.tool === 'ERASER') context.globalCompositeOperation = 'destination-out';
        else context.globalCompositeOperation = 'source-over';

        setIsDrawing(true);

        currentPathRef.current = [{x: offsetX, y: offsetY}];

        context.beginPath();
        context.moveTo(offsetX, offsetY);
        lastPointRef.current = {x: offsetX, y: offsetY};
    };

    const draw = (context,{nativeEvent}) =>{
        if(!isDrawing) return;
        
        const {offsetX, offsetY} = nativeEvent;

        context.lineTo(offsetX,offsetY);
        context.stroke();

        if(socket && lastPointRef.current){
            
            socket.emit('DRAW_ACTION',{
                roomid:roomid,
                strokeData:{
                    from:lastPointRef.current,
                    to:{x: offsetX, y: offsetY},
                    color: toolOptions.color,
                    strokeWidth: toolOptions.strokeWidth,
                    tool: toolOptions.tool,
                }
            });

        }
        currentPathRef.current.push({x: offsetX, y: offsetY});
        lastPointRef.current = {x: offsetX, y: offsetY};
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        
        if (socket && currentPathRef.current.length > 1) {
            socket.emit("DRAW_STROKE", {
                roomId: roomId,
                strokeData: {
                    path: currentPathRef.current,
                    options: toolOptions,
                },
            });
        }
        
        currentPathRef.current = [];
        lastPointRef.current = null;
    };

    return {
        startDrawing,
        draw,
        stopDrawing
    };
};  