import React, { useContext, useState } from 'react';
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
    Settings
} from "lucide-react";

const ToolBar = () => {
    const { toolOptions, updateToolOptions, changeTool } = useContext(ToolContext);
    const socket = useContext(SocketContext);
    const { roomid } = useParams();
    
    // Local state for UI
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [connectedUsers] = useState(3); // Mock data - replace with real socket data

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

    const handleSaveCanvas = () => {
        if (socket) {
            socket.emit('SAVE_CANVAS', roomid);
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
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 ${showColorPicker ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
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
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg p-3 animate-fade-in">
                <div className="flex items-center gap-3">
                    
                    {/* Connected Users Indicator */}
                    <Tooltip content={`${connectedUsers} users connected`}>
                        <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md">
                            <Users className="h-4 w-4 text-gray-600" />
                            <Badge variant="secondary">
                                {connectedUsers}
                            </Badge>
                        </div>
                    </Tooltip>

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

                        <div className="flex flex-col items-center gap-1 min-w-[80px]">
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

                        <Tooltip content="Save canvas">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleSaveCanvas}
                                className="p-2"
                            >
                                <Save className="h-4 w-4" />
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
                <div className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded inline-block">
                    Press P for Pen • E for Eraser • Ctrl+Z to Undo
                </div>
            </div>
        </div>
    );
};

export default ToolBar;