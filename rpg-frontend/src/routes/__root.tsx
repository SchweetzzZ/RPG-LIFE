import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return (
        <>
            {/* O Outlet renderiza o conteúdo da rota atual (login ou app principal) */}
            <Outlet />
            {import.meta.env.DEV && <TanStackRouterDevtools />}
        </>
    );
}