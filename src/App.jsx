import { useState } from 'react'
import './App.css'
import DrawingBoard from './components/drawingBoard'
import ToolBar from './components/Toolbar'
import { ToolProvider } from './ToolProvider'

function App() {

  // useEffect(()=>{
    
  // },[currTool]);

  return (
    <ToolProvider>
    <div className='' >
      <DrawingBoard />
      <ToolBar />
    </div>
    </ToolProvider>
  )
}

export default App
