// Utility functions for canvas operations
export const canvasUtils = {
    // Initialize canvas size and context properties
    initializeCanvas: (canvas, color, strokeWidth,roomWidth,roomHeight) => {
        const context = canvas.getContext("2d");
        canvas.width = roomWidth;
        canvas.height = roomHeight;
        
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
        context.lineCap = "round";
        
        return context;
    },

    // Update canvas context properties when tool options change
    updateCanvasProperties: (context, color, strokeWidth) => {
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
        context.lineCap = "round";
    },

    // Draw a stroke on the given context
    drawStroke: (context, strokeData) => {
        context.save();
        
        context.strokeStyle = strokeData.color;
        context.lineWidth = strokeData.strokeWidth;
        context.lineCap = 'round';
        context.globalCompositeOperation = 
            strokeData.tool === 'ERASER' ? 'destination-out' : 'source-over';
        
        context.beginPath();
        context.moveTo(strokeData.path[0].x, strokeData.path[0].y);

        for (let i = 1; i < strokeData.path.length; i++) {
            context.lineTo(strokeData.path[i].x, strokeData.path[i].y);
        }
        
        context.stroke();
        context.restore();
    },

    // Draw a line segment (for real-time drawing)
    drawSegment: (context, data) => {
        context.save();
        
        context.strokeStyle = data.color;
        context.lineWidth = data.strokeWidth;
        context.globalCompositeOperation = 
            data.tool === "ERASER" ? "destination-out" : "source-over";

        context.beginPath();
        context.moveTo(data.from.x, data.from.y);
        context.lineTo(data.to.x, data.to.y);
        context.stroke();
        
        context.restore();
    },

    // Clear the entire canvas
    clearCanvas: (canvas) => {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    },

    // Create a snapshot from canvas content
    createSnapshot: (canvas, baseImageURL, strokesToSave, onComplete) => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        
        const ctx = offscreenCanvas.getContext('2d');

        const generateSnapshot = () => {
            // Draw the strokes
            strokesToSave.forEach(stroke => {
                canvasUtils.drawStroke(ctx, stroke);
            });

            // Generate the new image URL
            const newSnapshotURL = offscreenCanvas.toDataURL('image/webp', 0.8);
            onComplete(newSnapshotURL);
        };

        if (baseImageURL) {
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0);
                generateSnapshot();
            };
            image.onerror = generateSnapshot;
            image.src = baseImageURL;
        } else {
            generateSnapshot();
        }
    },

    // Load and draw canvas history
    loadCanvasHistory: (canvas, baseImageURL, history,roomWidth,roomHeight) => {
        const context = canvas.getContext("2d");
        
        // Set canvas dimensions
        canvas.width = roomWidth;
        canvas.height = roomHeight;

        // Clear canvas first
        context.clearRect(0, 0, roomWidth, roomHeight);

        const drawHistory = () => {
            if (history && history.length > 0) {
                history.forEach((strokeData) => {
                    canvasUtils.drawStroke(context, strokeData);
                });
            }
        };

        if (baseImageURL) {
            const image = new Image();
            image.onload = () => {
                context.drawImage(image, 0, 0);
                drawHistory();
            };
            image.onerror = () => {
                console.error("Failed to load base image from URL.");
                drawHistory();
            };
            image.src = baseImageURL;
        } else {
            drawHistory();
        }
    }
};