import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PuzzleApp from './PuzzleApp';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><PuzzleApp /></StrictMode>,
);
