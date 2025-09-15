// filepath: src/components/CreateRoomDialog.jsx
import { useState } from "react";
import Button from "./ui/Button";

const PRESET_SIZES = {
  "Default (1280x720)": { width: 1280, height: 720 }
};

const CreateRoomDialog = ({ onCreateRoom, onClose }) => {
  const [size, setSize] = useState(PRESET_SIZES["Default (1280x720)"]);

  const handleCreate = () => {
    onCreateRoom(size);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-neutral-800 text-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Create a New Board</h2>
        <div className="space-y-4">
          <p className="text-sm text-white">Choose a canvas size to start:</p>
          <div className="grid grid-cols-1 gap-2 text-black">
            {Object.entries(PRESET_SIZES).map(([name, dimensions]) => (
              <button
                key={name}
                onClick={() => setSize(dimensions)}
                className={`p-3 text-left rounded-md border transition-colors ${
                  size.width === dimensions.width && size.height === dimensions.height
                    ? "bg-blue-100 border-blue-500 ring-2 ring-blue-500"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {/* Placeholder for future freehand/custom input */}
          <p className="text-center text-xs text-gray-200 pt-2">Custom size input coming soon!</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            Create and Join
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomDialog;