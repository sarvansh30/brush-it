import { useState } from "react";
import { ToolContext } from "./ToolContext";

const initialTool = {
    tool: 'PEN',
    color: '#000000',
    strokeWidth: 5,
};


export const ToolProvider = ({children})=>{

    const [toolOptions, setToolOptions] = useState(initialTool);

    const updateToolOptions = (option,value)=>{
        setToolOptions((prevOptions) => ({
            ...prevOptions,
            [option]: value,
        }));
    };

    const changeTool =(newTool)=>{
        switch(newTool){
            case 'PEN':
                setToolOptions({
                    tool: 'PEN',
                    color: '#000000',
                    strokeWidth: 5,
                });
                break;
            case 'ERASER':
                setToolOptions({
                    tool: 'ERASER',
                    strokeWidth :5,
                });
                break;
            case 'TEXT':
                setToolOptions({
                    tool: 'TEXT',
                    color: '#000000',
                    fontSize: 12,
                });
                break;  
                
        };
    };

    const value ={
        toolOptions,
        updateToolOptions,
        changeTool
    };

    return ( <ToolContext.Provider value={value}>
        {children}
        </ToolContext.Provider>);
}