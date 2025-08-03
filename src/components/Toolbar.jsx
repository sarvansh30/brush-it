import { ToolContext } from "../ToolContext";
import React, { useContext } from 'react';

const ToolBar = () =>{
    const {tool,setTool,color,setColor,strokeWidth,setStrokeWidth} = useContext(ToolContext);

    const handleClick = ()=>{
        setColor("#FFFFFF");
        setTool("ERASE");
    }

    return(
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2  p-2 rounded-xl border-1 flex gap-7">

        <button className="hover:bg-amber-200 hover:cursor-pointer" onClick={()=>setColor('#000000')}>Draw</button>
        <button className="hover:bg-amber-200 hover:cursor-pointer" onClick={handleClick}>Erase</button>

        </div>
    );
};

export default ToolBar;