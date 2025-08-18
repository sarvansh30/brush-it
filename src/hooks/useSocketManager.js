

export const useSocketManager = (socket,roomid,callbacks) => {
    
    useEffect(()=>{
        if(!socket || !roomid) return;

        const {onCanvasState,onDrawAction,onSnapshotRequest,onDrawStroke} = callbacks;

        socket.on('CANVAS_STATE',onCanvasState);

        socket.on('DRAW_ACTION',onDrawAction);

        socket.on('SNAPSHOT_REQUEST',onSnapshotRequest);

        socket.on('DRAW_STROKE',onDrawStroke);

        return ()=>{
            socket.off('CANVAS_STATE');
            socket.off('DRAW_ACTION');
            socket.off('SNAPSHOT_REQUEST');
            socket.off('DRAW_STROKE');
        };
    },[ socket, roomid, callbacks ]);
}