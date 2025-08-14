import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import Home from './pages/HomePage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path ='/' element={<Home/>}/>
      <Route path='/room/:roomid' element={<App />} />
    </Routes>
    </BrowserRouter>
  </StrictMode>,
)
