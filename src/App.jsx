import { useState } from 'react'
import './App.css'
import DrawingBoard from './components/drawingBoard'
import ToolBar from './components/Toolbar'

function App() {

const [currTool,SetCurrTool] = useState("DRAW");


  return (
    <div className='' >
      <DrawingBoard />
      <ToolBar SetCurrTool={SetCurrTool} />
    </div>
  )
}

export default App
