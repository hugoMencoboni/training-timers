import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Timer from './pages/Timer'

export default function App() {
  return (
    <div className="h-full flex flex-col max-w-lg mx-auto">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edit/:id?" element={<Editor />} />
        <Route path="/timer/:id" element={<Timer />} />
      </Routes>
    </div>
  )
}
