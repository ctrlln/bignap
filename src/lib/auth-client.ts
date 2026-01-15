export interface LoginResponse {
    token: string;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        roles: string[];
        created_at: string;
    }
}

const API_URL = 'http://localhost:3000/api';

export async function login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(err.error || 'Login failed');
    }

    return res.json();
}
