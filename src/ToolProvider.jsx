import { useState } from "react";
import { ToolContext } from "./ToolContext";


export const ToolProvider = ({children})=>{
    const [tool,setTool] = useState('brush');
    const [color,setColor] = useState('#000000');
    const [strokeWidth,setStrokeWidth] = useState(5);

    const value ={
        tool,setTool,
        color,setColor,
        strokeWidth,setStrokeWidth,
    };
    return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>
}