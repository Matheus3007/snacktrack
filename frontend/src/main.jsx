import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import DataPage from './DataPage.jsx'
import AfterHoursPage from './AfterHoursPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/after-hours" element={<AfterHoursPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
