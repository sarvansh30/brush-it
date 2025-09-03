import { useEffect, useContext } from 'react';
import { ToolContext } from '../context/ToolContext';
import { SocketContext } from '../context/SocketContext';

export const useKeyboardShortcuts = (roomid) => {
    const { changeTool, updateToolOptions, toolOptions } = useContext(ToolContext);
    const socket = useContext(SocketContext);

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Don't trigger shortcuts if user is typing in an input
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            const { key, ctrlKey, metaKey, shiftKey } = event;
            const isCtrlOrCmd = ctrlKey || metaKey;

            switch (key.toLowerCase()) {
                case 'p':
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        changeTool('PEN');
                    }
                    break;

                case 'e':
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        changeTool('ERASER');
                    }
                    break;

                case 'z':
                    if (isCtrlOrCmd && !shiftKey) {
                        event.preventDefault();
                        if (socket) {
                            socket.emit('UNDO_ACTION', roomid);
                        }
                    }
                    break;

                case 'y':
                    if (isCtrlOrCmd) {
                        event.preventDefault();
                        if (socket) {
                            socket.emit('REDO_ACTION', roomid);
                        }
                    }
                    break;

                case 'z':
                    if (isCtrlOrCmd && shiftKey) {
                        event.preventDefault();
                        if (socket) {
                            socket.emit('REDO_ACTION', roomid);
                        }
                    }
                    break;

                case 's':
                    if (isCtrlOrCmd) {
                        event.preventDefault();
                        if (socket) {
                            socket.emit('SAVE_CANVAS', roomid);
                        }
                    }
                    break;

                case '[':
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        const newWidth = Math.max(1, toolOptions.strokeWidth - 1);
                        updateToolOptions('strokeWidth', newWidth);
                    }
                    break;

                case ']':
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        const newWidth = Math.min(50, toolOptions.strokeWidth + 1);
                        updateToolOptions('strokeWidth', newWidth);
                    }
                    break;

                case 'delete':
                case 'backspace':
                    if (isCtrlOrCmd) {
                        event.preventDefault();
                        if (socket) {
                            socket.emit('CANVAS_RESET', roomid);
                        }
                    }
                    break;

                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    if (!isCtrlOrCmd) {
                        event.preventDefault();
                        const sizes = { '1': 2, '2': 5, '3': 10, '4': 20, '5': 35 };
                        updateToolOptions('strokeWidth', sizes[key]);
                    }
                    break;

                default:
                    break;
            }
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [changeTool, updateToolOptions, toolOptions, socket, roomid]);

    // Return available shortcuts for display
    return {
        shortcuts: [
            { key: 'P', description: 'Switch to Pen' },
            { key: 'E', description: 'Switch to Eraser' },
            { key: 'Ctrl+Z', description: 'Undo' },
            { key: 'Ctrl+Y', description: 'Redo' },
            { key: 'Ctrl+S', description: 'Save' },
            { key: '[ / ]', description: 'Decrease/Increase brush size' },
            { key: '1-5', description: 'Quick brush sizes' },
            { key: 'Ctrl+Del', description: 'Clear canvas' }
        ]
    };
};