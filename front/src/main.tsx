import { createRoot } from 'react-dom/client'
import App from '@/App.tsx'
import '@/index.css'
import { GameProvider } from "@/contexts/GameContext"

createRoot(document.getElementById('root')!).render(
  <>
    <div id="app"></div>
    <GameProvider>
      <App />
    </GameProvider>
  </>
)
