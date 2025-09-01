import { SocketContext } from "../context/SocketContext";
import { ToolContext } from "../context/ToolContext";
import React, { useContext } from 'react';
import { useParams } from "react-router-dom";

const ToolBar = () =>{
    const { toolOptions, updateToolOptions, changeTool } = useContext(ToolContext);
    const socket = useContext(SocketContext);
    
    const { roomid } = useParams();

    const handleReset = ()=>{
        if (socket){
        socket.emit('CANVAS_RESET',roomid);
        }
    };

    const handleUndo = () =>{
        if(socket){
            socket.emit('UNDO_ACTION',roomid);
        }
    };
    
    const handleRedo = ()=>{
        if(socket){
            socket.emit("REDO_ACTION",roomid);
        }
    };

    return(
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2  p-2 rounded-xl border-1 flex gap-7">

        <button className="hover:bg-amber-200 hover:cursor-pointer" onClick={()=>changeTool('PEN')}>Draw</button>
        
        <button className="hover:bg-amber-200 hover:cursor-pointer" onClick={()=>changeTool("ERASER")}>Erase</button>
        
        <p>Stroke: </p>
        <input 
        type="range" 
        name="strokeWidth" 
        id="strokeWidth"
        min='1'
        max='50'
        value={toolOptions.strokeWidth}
        onChange={(e)=>updateToolOptions('strokeWidth', parseInt(e.target.value,10))} />

        <p>Color:</p>
        <input  
        type="color"
         name="color"
          id="color"
          value={toolOptions.color}
          onChange={(e)=>updateToolOptions('color', e.target.value)} />
        

        <button className="hover:cursor-pointer" onClick={handleReset}>RESET</button>

         <button className='hover:cursor-pointer' onClick={handleUndo}>Undo</button>

         <button className='hover:cursor-pointer' onClick={handleRedo}>Redo</button>
        </div>
    );
};

export default ToolBar;