// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'        // Use the existing index.css
import App from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)