import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, UserRole } from '../lib/data/types';
import { login as apiLogin } from '../lib/auth-client';

interface AuthContextType {
    user: User | null;
    updateProfile: (updates: Partial<User>) => void;
    isLoading: boolean;
    loginAsRole: (role: UserRole) => Promise<void>; // Sets override
    loginAsUser: (userId: number) => Promise<void>; // Legacy/No-op
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    availableRoles: UserRole[];
    devOverrideRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_TOKEN = 'bignap_token';
const STORAGE_KEY_USER = 'bignap_user';
const STORAGE_KEY_OVERRIDE = 'bignap_dev_role_override';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem(STORAGE_KEY_TOKEN));
    const [devOverrideRole, setDevOverrideRole] = useState<UserRole | null>(
        (localStorage.getItem(STORAGE_KEY_OVERRIDE) as UserRole) || null
    );
    const [isLoading, setIsLoading] = useState(true);

    const availableRoles: UserRole[] = ['admin', 'master_trainer', 'trainer', 'trainee', 'center_director'];

    // Restore session
    useEffect(() => {
        const storedUser = localStorage.getItem(STORAGE_KEY_USER);
        if (storedUser && token) {
            try {
                const parsed = JSON.parse(storedUser);
                // Backfill roles for legacy data
                if (!parsed.roles) parsed.roles = [];
                setUser(parsed);
            } catch (e) {
                console.error('Failed to parse stored user', e);
                localStorage.removeItem(STORAGE_KEY_USER);
            }
        }
        setIsLoading(false);
    }, []);

    // Effect: Update effective user role when override changes
    const effectiveUser = useMemo(() => {
        if (!user) return null;
        if (devOverrideRole) {
            // Simplified override: just replace the first role or add it if strictly needed.
            // For RBAC checks that look at `user.roles`, this is important.
            // The previous logic was { ...user, role: override }.
            // Now user has roles: UserRole[].
            // We'll prepend the override role to make it primary, or replace.
            return {
                ...user,
                roles: [devOverrideRole, ...user.roles.filter(r => r !== devOverrideRole)]
            };
        }
        return user;
    }, [user, devOverrideRole]);

    const login = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            const data = await apiLogin(email, pass);
            setToken(data.token);
            localStorage.setItem(STORAGE_KEY_TOKEN, data.token);

            // Map API response to User type
            // ensure roles are cast correctly
            const adaptedUser: User = {
                id: data.user.id,
                email: data.user.email,
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                roles: data.user.roles as UserRole[],
                created_at: data.user.created_at
            };

            console.log('Logged in as:', adaptedUser);
            setUser(adaptedUser);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(adaptedUser));
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const loginAsRole = async (role: UserRole) => {
        console.log('[Dev] Setting role override:', role);
        setDevOverrideRole(role);
        localStorage.setItem(STORAGE_KEY_OVERRIDE, role);
    };

    const loginAsUser = async (_userId: number) => {
        console.warn('loginAsUser is deprecated in favor of real auth.');
    };

    const updateProfile = (updates: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...updates };
        setUser(updated);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setDevOverrideRole(null);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_OVERRIDE);
    };

    return (
        <AuthContext.Provider value={{
            user: effectiveUser,
            isLoading,
            loginAsRole,
            loginAsUser,
            login,
            logout,
            updateProfile,
            availableRoles,
            devOverrideRole
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper to get current auth headers for API calls
export function getAuthHeaders() {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const override = localStorage.getItem(STORAGE_KEY_OVERRIDE);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Only in dev/test (or always send, backend ignores in prod)
    if (override) {
        headers['X-Dev-Role-Override'] = override;
    }

    return headers;
}
