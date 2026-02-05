import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSentry } from '@/shared/config/sentry';
import './index.css';
import App from './App.tsx'

// Initialize Sentry error tracking (before React renders)
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
