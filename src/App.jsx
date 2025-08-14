
import "./App.css";
import DrawingBoard from "./components/drawingBoard";
import ToolBar from "./components/Toolbar";
import { ToolProvider } from "./ToolProvider";
import { SocketProvider } from "./SocketProvider";

function App() {
  // useEffect(()=>{

  // },[currTool]);

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
