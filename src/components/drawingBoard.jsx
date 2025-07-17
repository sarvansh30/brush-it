import React, { useRef, useState, useEffect } from 'react';

const DrawingBoard = ()=>{
    const canvasRef = useRef(null)
    const [isDrawing,setIsDrawing] = useState(false);

    useEffect(()=>{
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        context.strokeStyle = "black";
        context.lineWidth = 5;
        
    },[])
    
    const startDrawing = ({nativeEvent})=>{
        setIsDrawing(true);

        const {offsetX,offsetY} = nativeEvent;
        const context = canvasRef.current.getContext('2d');

        context.beginPath();

        context.moveTo(offsetX,offsetY)
    }

    const stopDrawing = ()=>{
        setIsDrawing(false);
    }

    const draw = ({nativeEvent}) =>{

        if(!isDrawing) return;

        const context = canvasRef.current.getContext('2d');
        const {offsetX,offsetY} = nativeEvent;
        
        context.lineTo(offsetX,offsetY);
        
        context.stroke();

    }

    return(
        <div  >
            <canvas ref={canvasRef} 
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            />
        </div>
    );
}

export default DrawingBoard;