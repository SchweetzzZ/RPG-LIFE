import { createFileRoute, redirect } from '@tanstack/react-router';
import App from '../App';

export const Route = createFileRoute('/')({
    beforeLoad: () => {
        const token = localStorage.getItem('access_token');

        // Se NÃO tiver o token da API, bloqueia a rota e joga pro login
        if (!token) {
            throw redirect({
                to: '/login',
            });
        }
    },
    component: IndexRouteComponent,
});

function IndexRouteComponent() {
    return <App />;
}