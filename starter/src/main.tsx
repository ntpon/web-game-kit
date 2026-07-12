import { createRoot } from 'react-dom/client';
import App from './App';

// No StrictMode on purpose: its dev-mode double-mount would boot two Phaser games.
createRoot(document.getElementById('root')!).render(<App />);
