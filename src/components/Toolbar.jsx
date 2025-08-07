import { ToolContext } from "../ToolContext";
import React, { useContext } from 'react';

const ToolBar = () =>{
    const {tool,setTool,color,setColor,strokeWidth,setStrokeWidth} = useContext(ToolContext);

    return(
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2  p-2 rounded-xl border-1 flex gap-7">

        <button className="hover:bg-amber-200 hover:cursor-pointer" onClick={()=>setTool('DRAW')}>Draw</button>
        
        <button className="hover:bg-amber-200 hover:cursor-pointer" onClick={()=>setTool("ERASE")}>Erase</button>
        
        <p>Stroke: </p>
        <input 
        type="range" 
        name="strokeWidth" 
        id="strokeWidth"
        min='1'
        max='50'
        value={strokeWidth}
        defaultValue={5}
        onChange={(e)=>setStrokeWidth(parseInt(e.target.value,10))} />

        <p>Color:</p>
        <input  
        type="color"
         name="color"
          id="color"
          defaultValue={"black"}
          value={color}
          onChange={(e)=>setColor(e.target.value)} />
        
        </div>
    );
};

export default ToolBar;