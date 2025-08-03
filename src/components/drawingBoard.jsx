import React, { useRef, useState, useEffect, useContext } from 'react';
import { ToolContext } from '../ToolContext';

const DrawingBoard = ()=>{

    const {tool,color,strokeWidth} = useContext(ToolContext);
    const canvasRef = useRef(null)
    const [isDrawing,setIsDrawing] = useState(false);

    useEffect(()=>{
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        
        
    },[])
    
    useEffect(()=>{
        const canvas = canvasRef.current;
  const context = canvas.getContext('2d');
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
    },[color,strokeWidth])
    const startDrawing = ({nativeEvent})=>{
        setIsDrawing(true);

        const {offsetX,offsetY} = nativeEvent;
        const context = canvasRef.current.getContext('2d');

        context.beginPath();

        context.moveTo(offsetX,offsetY)
         const startInfo = {
        type: "DRAW_START",
        offsetX: offsetX,
        offsetY: offsetY
    };
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(startInfo));
    }
    }

    const stopDrawing = ()=>{
        setIsDrawing(false);
    }

    const draw = ({nativeEvent}) =>{

        if(!isDrawing) return;

        const context = canvasRef.current.getContext('2d');
        const {offsetX,offsetY} = nativeEvent;
        const drawInfo = {
            type:"DRAW",
            offsetX:offsetX,
            offsetY:offsetY
        }
        
        context.lineTo(offsetX,offsetY);
        
        context.stroke();

        if(socketRef.current && socketRef.current.readyState ===WebSocket.OPEN){
            socketRef.current.send(JSON.stringify(drawInfo));
        }

    }

    const drawRemote = (x,y)=>{
        const context = canvasRef.current.getContext('2d');
        context.lineTo(x,y);
        context.stroke();
    }

    const socketRef = useRef(null);
    useEffect(()=>{

        const socket = new WebSocket('ws://localhost:3000');

        socket.onopen = () =>{
            console.log("Websocket connection established");
        };

        socket.onmessage = async (event) => {
            const context = canvasRef.current.getContext('2d');
            const blob = await event.data.text();

            const msg = JSON.parse(blob);
            if (msg.type=="DRAW_START"){
                // console.log("draw start");
            const x=msg.offsetX;
            const y = msg.offsetY;
            context.beginPath();
            context.moveTo(x,y);
           }
           if(msg.type=="DRAW"){
               const x = msg.offsetX;
               const y = msg.offsetY;
               
               drawRemote(x,y);
           }
           
        }
        
        // socket.send();

        socket.onclose = () =>{
            console.log('Websocket closed');
        };

        socketRef.current = socket;

        return ()=>{
            socket.close();
        };

    },[]);

    return(
        <div  >
            <canvas ref={canvasRef} 
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={()=>setIsDrawing(false)}
            />
        </div>
    );
}

export default DrawingBoard;