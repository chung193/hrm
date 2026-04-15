import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from "react-helmet-async";
import { LoadingProvider } from './context/LoadingContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </HelmetProvider>
    </BrowserRouter>
  </StrictMode>,
)
