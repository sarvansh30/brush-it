// filepath: src/components/CreateRoomDialog.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

const PRESET_SIZES = {
  "Default (1280x720)": { width: 1280, height: 720 },
  "Square (1080x1080)": { width: 1080, height: 1080 },
  "Instagram Story (1080x1920)": { width: 1080, height: 1920 },
};

const CreateRoomDialog = () => {
  const [size, setSize] = useState(PRESET_SIZES["Default (1280x720)"]);
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const newRoomId = "some-generated-id"; // your logic to generate a room ID

    navigate(
      `/room/${newRoomId}`,
      {
        state: {
          width: size.width,
          height: size.height,
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create a New Board</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose a canvas size to start:</p>
          <div className="grid grid-cols-1 gap-2">
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
          <p className="text-center text-xs text-gray-400 pt-2">Custom size input coming soon!</p>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleCreateRoom} className="w-full sm:w-auto">
            Create and Join
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomDialog;