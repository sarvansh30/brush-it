
import "./App.css";
import DrawingBoard from "./components/drawingBoard";
import ToolBar from "./components/Toolbar";
import { ToolProvider } from "./context/ToolProvider";
import { SocketProvider } from "./context/SocketProvider";
function App() {
  
  return (
    <SocketProvider>
      <ToolProvider>
        <div className="">
          <DrawingBoard />
          <ToolBar /> 
        </div>
      </ToolProvider>
    </SocketProvider>
  );
}

export default App;
