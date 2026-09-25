import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppStateProvider } from './state/AppState'
import { DebugDrawer } from './components/DebugDrawer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppStateProvider>
        <App />
        <DebugDrawer />
      </AppStateProvider>
    </BrowserRouter>
  </StrictMode>,
)
