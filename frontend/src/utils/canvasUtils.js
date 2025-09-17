// Utility functions for canvas operations
export const canvasUtils = {
    // Initialize canvas size and context properties
    initializeCanvas: (canvas, color, strokeWidth, roomWidth, roomHeight) => {
        const context = canvas.getContext("2d");
        // canvas.width = roomWidth;
        // canvas.height = roomHeight;
        
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
        if (strokeData.path && strokeData.path.length > 0) {
            context.moveTo(strokeData.path[0].x, strokeData.path[0].y);

            for (let i = 1; i < strokeData.path.length; i++) {
                context.lineTo(strokeData.path[i].x, strokeData.path[i].y);
            }
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

    // Create a snapshot from canvas content - ENHANCED WITH DEBUGGING
    createSnapshot: (canvas, baseImageURL, strokesToSave, onComplete) => {
        console.log('🔧 [CREATE_SNAPSHOT] Starting snapshot creation:', {
            canvasExists: !!canvas,
            canvasWidth: canvas?.width,
            canvasHeight: canvas?.height,
            baseImageURL: !!baseImageURL,
            strokesToSaveCount: strokesToSave?.length || 0,
            onCompleteExists: typeof onComplete === 'function'
        });

        if (!canvas) {
            console.error('❌ [CREATE_SNAPSHOT] Canvas is null/undefined');
            if (onComplete) onComplete(null);
            return;
        }

        if (!onComplete || typeof onComplete !== 'function') {
            console.error('❌ [CREATE_SNAPSHOT] onComplete callback is not a function');
            return;
        }

        try {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = canvas.width;
            offscreenCanvas.height = canvas.height;
            
            console.log('📋 [CREATE_SNAPSHOT] Created offscreen canvas:', {
                width: offscreenCanvas.width,
                height: offscreenCanvas.height
            });
            
            const ctx = offscreenCanvas.getContext('2d');
            if (!ctx) {
                console.error('❌ [CREATE_SNAPSHOT] Failed to get offscreen canvas context');
                onComplete(null);
                return;
            }

            const generateSnapshot = () => {
                console.log('🎨 [CREATE_SNAPSHOT] Drawing strokes on offscreen canvas...');
                
                // Draw the strokes
                if (strokesToSave && strokesToSave.length > 0) {
                    strokesToSave.forEach((stroke, index) => {
                        try {
                            console.log(`Drawing stroke ${index + 1}/${strokesToSave.length}:`, stroke);
                            canvasUtils.drawStroke(ctx, stroke);
                        } catch (strokeError) {
                            console.error(`❌ [CREATE_SNAPSHOT] Error drawing stroke ${index}:`, strokeError, stroke);
                        }
                    });
                    console.log('✅ [CREATE_SNAPSHOT] Finished drawing all strokes');
                } else {
                    console.log('📝 [CREATE_SNAPSHOT] No strokes to draw');
                }

                try {
                    // Generate the new image URL
                    console.log('📸 [CREATE_SNAPSHOT] Converting canvas to data URL...');
                    const newSnapshotURL = offscreenCanvas.toDataURL('image/webp', 0.8);
                    console.log('✅ [CREATE_SNAPSHOT] Snapshot created successfully:', {
                        snapshotLength: newSnapshotURL.length,
                        format: 'webp'
                    });
                    onComplete(newSnapshotURL);
                } catch (dataUrlError) {
                    console.error('❌ [CREATE_SNAPSHOT] Error converting to data URL:', dataUrlError);
                    // Try with PNG format as fallback
                    try {
                        console.log('🔄 [CREATE_SNAPSHOT] Trying PNG format as fallback...');
                        const fallbackURL = offscreenCanvas.toDataURL('image/png', 1.0);
                        console.log('✅ [CREATE_SNAPSHOT] Fallback PNG created successfully');
                        onComplete(fallbackURL);
                    } catch (fallbackError) {
                        console.error('❌ [CREATE_SNAPSHOT] Fallback PNG also failed:', fallbackError);
                        onComplete(null);
                    }
                }
            };

            if (baseImageURL) {
                console.log('🖼️ [CREATE_SNAPSHOT] Loading base image first...');
                const image = new Image();
                
                image.onload = () => {
                    console.log('✅ [CREATE_SNAPSHOT] Base image loaded successfully');
                    try {
                        ctx.drawImage(image, 0, 0);
                        console.log('✅ [CREATE_SNAPSHOT] Base image drawn to offscreen canvas');
                        generateSnapshot();
                    } catch (drawImageError) {
                        console.error('❌ [CREATE_SNAPSHOT] Error drawing base image:', drawImageError);
                        generateSnapshot(); // Continue without base image
                    }
                };
                
                image.onerror = (imageError) => {
                    console.error('❌ [CREATE_SNAPSHOT] Base image failed to load:', imageError);
                    console.log('🔄 [CREATE_SNAPSHOT] Continuing without base image...');
                    generateSnapshot();
                };
                
                // Add timeout for image loading
                setTimeout(() => {
                    if (!image.complete) {
                        console.warn('⚠️ [CREATE_SNAPSHOT] Image loading timeout, proceeding without base image');
                        generateSnapshot();
                    }
                }, 5000); // 5 second timeout
                
                image.src = baseImageURL;
            } else {
                console.log('📋 [CREATE_SNAPSHOT] No base image, generating snapshot directly...');
                generateSnapshot();
            }
        } catch (error) {
            console.error('❌ [CREATE_SNAPSHOT] Unexpected error in createSnapshot:', error);
            if (onComplete) onComplete(null);
        }
    },

    // Load and draw canvas history
    loadCanvasHistory: (canvas, baseImageURL, history, roomWidth, roomHeight) => {
        const context = canvas.getContext("2d");
        
        // Only clear the content, not reset dimensions
        context.clearRect(0, 0, canvas.width, canvas.height);

        console.log('🎨 Loading canvas history:', { 
            baseImageURL: !!baseImageURL, 
            historyLength: history?.length || 0,
            canvasSize: { width: canvas.width, height: canvas.height }
        });

        const drawHistory = () => {
            if (history && history.length > 0) {
                console.log(`📝 Drawing ${history.length} strokes from history`);
                history.forEach((strokeData, index) => {
                    try {
                        canvasUtils.drawStroke(context, strokeData);
                    } catch (error) {
                        console.error(`Error drawing history stroke ${index}:`, error, strokeData);
                    }
                });
                console.log('✅ Finished drawing history');
            } else {
                console.log('📭 No history to draw');
            }
        };

        if (baseImageURL) {
            console.log('🖼️ Loading base image...');
            const image = new Image();
            image.onload = () => {
                console.log('✅ Base image loaded, drawing it first');
                context.drawImage(image, 0, 0);
                drawHistory();
            };
            image.onerror = (error) => {
                console.error("❌ Failed to load base image:", error);
                drawHistory();
            };
            image.src = baseImageURL;
        } else {
            console.log('📋 No base image, drawing history directly');
            drawHistory();
        }
    },

    // Helper function to check if canvas is properly initialized
    isCanvasReady: (canvas, expectedWidth, expectedHeight) => {
        return canvas && 
               canvas.width === expectedWidth && 
               canvas.height === expectedHeight &&
               canvas.getContext("2d");
    }
};      