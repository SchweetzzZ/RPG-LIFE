import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import { AuthScreen } from '../components/Auth/AuthScreen';
import { client } from '../services/api';

export const Route = createFileRoute('/login')({
    beforeLoad: async () => {
        try {
            const { data, response } = await client.GET('/user/me')

            if (response.ok && data) {
                throw redirect({ to: '/' })
            }
        } catch (err) {
            if (err && typeof err === 'object' && 'to' in err) {
                throw err;
            }
        }
    },
    component: LoginRouteComponent
})

function LoginRouteComponent() {
    const navigate = useNavigate();

    return (
        <AuthScreen
            onLoginSuccess={() => {
                navigate({ to: '/' })
            }}
        />
    );
}