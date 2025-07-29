import { useState } from 'react'
import './App.css'
import DrawingBoard from './components/drawingBoard'
import ToolBar from './components/Toolbar'

function App() {

const [currTool,SetCurrTool] = useState(0);

  useEffect(()=>{
    
  },[currTool]);

  return (
    <div className='' >
      <DrawingBoard />
      <ToolBar currTool={currTool} SetCurrTool={SetCurrTool} />
    </div>
  )
}

export default App
