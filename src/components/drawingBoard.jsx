import React, { useRef, useState, useEffect } from 'react';

const DrawingBoard = ()=>{
    const canvasRef = useRef(null)

    useEffect(()=>{
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        context.strokeStyle = "black";
        context.lineWidth = 5;
        
    },[])
    

    return(
        <div  >
            <canvas ref={canvasRef} />
        </div>
    );
}

export default DrawingBoard;