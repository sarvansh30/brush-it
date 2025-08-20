import  React, { useContext } from 'react';
import { ToolContext } from '../context/ToolContext';
import { SocketContext } from '../context/SocketContext';
import { useParams } from 'react-router-dom';
import { useDrawing } from '../hooks/useDrawing';

const Room = ()=>{

    const {toolOptions} = useContext(ToolContext);
    const socket = useContext(SocketContext);
    const {roomid} = useParams();
    const canvasRef = useRef(null);

    //calling custom hooks
    const { startDrawing, draw, stopDrawing } = useDrawing(socket, roomid, toolOptions);

    //add remote drawing logic here

    
};

export default Room;
