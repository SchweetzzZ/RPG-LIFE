import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';

// Este arquivo é gerado/atualizado automaticamente pelo plugin do TanStack Router no Vite
import { routeTree } from './routeTree.gen';
import './index.css';

// Criamos o roteador passando a árvore de rotas
const router = createRouter({ routeTree });

// Registra os tipos globais para que o TypeScript reconheça as rotas autocomplete
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);