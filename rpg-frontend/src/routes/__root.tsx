import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { BottomNav } from '../components/layout/BottomNav';

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return (
        <div className="min-h-screen bg-[#08090a] text-zinc-100 selection:bg-amber-400/20 selection:text-amber-300">
            {/* O Outlet renderiza o conteúdo da rota atual com padding inferior para a BottomNav */}
            <div className="pb-24">
                <Outlet />
            </div>
            <BottomNav />
            {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
        </div>
    );
}