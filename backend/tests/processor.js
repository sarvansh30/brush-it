'use strict';

function customHandleCanvasHistory(payload, context, ee, next) {
  console.log("Received CANVAS_HISTORY response:", payload);
  return next();
}

module.exports = {
  customHandleCanvasHistory
};
