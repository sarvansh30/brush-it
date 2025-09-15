import React, { useContext, useState, useRef, useEffect } from 'react';
import { SocketContext } from "../context/SocketContext";
import { ToolContext } from "../context/ToolContext";
import { useParams } from "react-router-dom";

// Custom UI Components
import Button from "./ui/Button";
import Toggle from "./ui/Toggle";
import Tooltip from "./ui/Tooltip";
import Slider from "./ui/Slider";
import Badge from "./ui/Badge";
import Separator from "./ui/Separator";

// Lucide React icons
import { 
    Pen, 
    Eraser, 
    Undo2, 
    Redo2, 
    Save, 
    Trash2,
    Palette,
    Minus,
    Plus,
    Users,
    Settings,
    GripVertical // Added for drag handle
} from "lucide-react";

const ToolBar = () => {
    const { toolOptions, updateToolOptions, changeTool } = useContext(ToolContext);
    const { socket, isConnected } = useContext(SocketContext);
    const { roomid } = useParams();
    
    // Local state for UI
    const [showColorPicker, setShowColorPicker] = useState(false);
    
    // Dragging state and refs
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isInitialized, setIsInitialized] = useState(false);
    const toolbarRef = useRef(null);
    const dragHandleRef = useRef(null);

    // Initialize position to center bottom
    useEffect(() => {
        if (!isInitialized && toolbarRef.current) {
            const toolbar = toolbarRef.current;
            const rect = toolbar.getBoundingClientRect();
            const centerX = (window.innerWidth - rect.width) / 2;
            const bottomY = window.innerHeight - rect.height - 12; // 32px from bottom
            
            setPosition({ x: centerX, y: bottomY });
            setIsInitialized(true);
        }
    }, [isInitialized]);

    // Handle drag start
    const handleDragStart = (e) => {
        if (!dragHandleRef.current?.contains(e.target)) return;
        
        setIsDragging(true);
        const rect = toolbarRef.current.getBoundingClientRect();
        setDragStart({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        
        // Prevent text selection during drag
        e.preventDefault();
        document.body.style.userSelect = 'none';
    };

    // Handle drag move
    const handleDragMove = (e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Constrain to viewport
        const toolbar = toolbarRef.current;
        const rect = toolbar.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        
        setPosition({
            x: Math.max(0, Math.min(maxX, newX)),
            y: Math.max(0, Math.min(maxY, newY))
        });
    };

    // Handle drag end
    const handleDragEnd = () => {
        setIsDragging(false);
        document.body.style.userSelect = '';
    };

    // Add global event listeners for drag
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            
            return () => {
                document.removeEventListener('mousemove', handleDragMove);
                document.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [isDragging, dragStart]);

    // Handle window resize to keep toolbar in bounds
    useEffect(() => {
        const handleResize = () => {
            if (toolbarRef.current) {
                const rect = toolbarRef.current.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                
                setPosition(prev => ({
                    x: Math.max(0, Math.min(maxX, prev.x)),
                    y: Math.max(0, Math.min(maxY, prev.y))
                }));
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Predefined colors for quick access
    const colorPalette = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
        '#808080', '#c0c0c0', '#800000', '#008000', '#000080'
    ];

    // Socket action handlers
    const handleReset = () => {
        if (socket) {
            socket.emit('CANVAS_RESET', roomid);
        }
    };

    const handleUndo = () => {
        if (socket) {
            socket.emit('UNDO_ACTION', roomid);
        }
    };
    
    const handleRedo = () => {
        if (socket) {
            socket.emit("REDO_ACTION", roomid);
        }
    };

    // Stroke width handlers
    const decreaseStroke = () => {
        const newWidth = Math.max(1, toolOptions.strokeWidth - 1);
        updateToolOptions('strokeWidth', newWidth);
    };

    const increaseStroke = () => {
        const newWidth = Math.min(50, toolOptions.strokeWidth + 1);
        updateToolOptions('strokeWidth', newWidth);
    };

    // Color picker component
    const ColorPicker = () => (
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 z-50 ${showColorPicker ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="w-64 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                    {colorPalette.map((color) => (
                        <button
                            key={color}
                            className={`color-button ${color === toolOptions.color ? 'ring-2 ring-blue-500' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                updateToolOptions('color', color);
                                setShowColorPicker(false);
                            }}
                            title={`Select ${color}`}
                        />
                    ))}
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Custom Color</label>
                    <input
                        type="color"
                        value={toolOptions.color}
                        onChange={(e) => updateToolOptions('color', e.target.value)}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div 
            ref={toolbarRef}
            className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: isInitialized ? 'none' : 'translate(-50%, -50%)'
            }}
        >
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg p-3 animate-fade-in">
                <div className="flex items-center gap-3">
                    
                    {/* Drag Handle */}
                    <div 
                        ref={dragHandleRef}
                        className={`flex flex-col items-center justify-center px-2 py-1 rounded cursor-grab hover:bg-gray-100 transition-colors ${isDragging ? 'cursor-grabbing bg-gray-200' : ''}`}
                        onMouseDown={handleDragStart}
                        title="Drag to move toolbar"
                    >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    {/* Drawing Tools */}
                    <div className="flex items-center gap-1">
                        <Tooltip content="Pen Tool (P)">
                            <Toggle
                                pressed={toolOptions.tool === 'PEN'}
                                onPressedChange={() => changeTool('PEN')}
                                size="sm"
                            >
                                <Pen className="h-4 w-4" />
                            </Toggle>
                        </Tooltip>

                        <Tooltip content="Eraser Tool (E)">
                            <Toggle
                                pressed={toolOptions.tool === 'ERASER'}
                                onPressedChange={() => changeTool('ERASER')}
                                size="sm"
                            >
                                <Eraser className="h-4 w-4" />
                            </Toggle>
                        </Tooltip>
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    {/* Stroke Width Controls */}
                    <div className="flex items-center gap-2">
                        <Tooltip content="Decrease stroke width">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={decreaseStroke}
                                disabled={toolOptions.strokeWidth <= 1}
                                className="p-2"
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                        </Tooltip>

                        <div className="flex flex-col items-center gap-1 min-w-[50px]">
                            <Slider
                                value={[toolOptions.strokeWidth]}
                                onValueChange={(value) => updateToolOptions('strokeWidth', value[0])}
                                max={50}
                                min={1}
                                step={1}
                                className="w-16"
                            />
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {toolOptions.strokeWidth}px
                            </Badge>
                        </div>

                        <Tooltip content="Increase stroke width">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={increaseStroke}
                                disabled={toolOptions.strokeWidth >= 50}
                                className="p-2"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </Tooltip>
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    {/* Color Picker */}
                    <div className="relative">
                        <Tooltip content="Choose color">
                            <button
                                className={`color-button ${showColorPicker ? 'ring-2 ring-blue-500' : ''}`}
                                style={{ 
                                    backgroundColor: toolOptions.color,
                                    borderColor: toolOptions.color === '#ffffff' ? '#e5e7eb' : 'transparent'
                                }}
                                onClick={() => setShowColorPicker(!showColorPicker)}
                            >
                                <Palette 
                                    className="h-4 w-4" 
                                    style={{ 
                                        color: toolOptions.color === '#000000' ? '#ffffff' : 
                                               toolOptions.color === '#ffffff' ? '#000000' : 
                                               toolOptions.color === '#ffff00' ? '#000000' : 
                                               '#ffffff'
                                    }} 
                                />
                            </button>
                        </Tooltip>
                        <ColorPicker />
                        
                        {/* Backdrop to close color picker */}
                        {showColorPicker && (
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowColorPicker(false)}
                            />
                        )}
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                        <Tooltip content="Undo (Ctrl+Z)">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUndo}
                                className="p-2"
                            >
                                <Undo2 className="h-4 w-4" />
                            </Button>
                        </Tooltip>

                        <Tooltip content="Redo (Ctrl+Y)">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRedo}
                                className="p-2"
                            >
                                <Redo2 className="h-4 w-4" />
                            </Button>
                        </Tooltip>

                        <Tooltip content="Clear canvas">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleReset}
                                className="p-2"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            </div>
            
            {/* Optional: Keyboard shortcuts hint */}
            <div className="mt-2 text-center">
                <div className="text-xs text-neutral-800 bg-white/80 px-2 py-1 rounded inline-block">
                    Press P for Pen • E for Eraser • Ctrl+Z to Undo • Drag ⋮⋮ to move
                </div>
            </div>
        </div>
    );
};

export default ToolBar;