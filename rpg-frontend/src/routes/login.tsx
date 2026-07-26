import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import { AuthScreen } from '../components/Auth/AuthScreen';
import { DEFAULT_PROFILE } from '../utils/storage';

export const Route = createFileRoute('/login')({
    beforeLoad: () => {
        const token = localStorage.getItem('access_token');
        // Só redireciona para a home se REALMENTE existir um token ativo
        if (token) {
            throw redirect({ to: '/' });
        }
    },
    component: LoginRouteComponent,
});

function LoginRouteComponent() {
    const navigate = useNavigate();

    return (
        <AuthScreen
            defaultProfile={DEFAULT_PROFILE}
            onLoginSuccess={() => {
                // Quando o login no NestJS der certo e salvar o token:
                navigate({ to: '/' });
            }}
        />
    );
}