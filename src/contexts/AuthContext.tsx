
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Student, Database, UserRole } from '../types';
import { fetchData } from '../lib/api';

interface AuthContextType {
    user: Student | null;
    isLoading: boolean;
    loginAsRole: (role: UserRole) => Promise<void>;
    loginAsUser: (userId: number) => Promise<void>;
    updateProfile: (updates: Partial<Student>) => void;
    logout: () => void;
    availableRoles: UserRole[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Student | null>(null);
    const [data, setData] = useState<Database | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const availableRoles: UserRole[] = ['admin', 'master_trainer', 'trainer', 'student'];

    // Load initial data and restore session
    useEffect(() => {
        fetchData().then((db) => {
            setData(db);
            const savedUserId = localStorage.getItem('bignap_auth_uid');
            if (savedUserId) {
                const found = db.students.find(s => s.student_id === Number(savedUserId));
                if (found) setUser(found);
            } else {
                // Default to a student if no session
                const defaultUser = db.students.find(s => s.role === 'student');
                if (defaultUser) setUser(defaultUser);
            }
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load DB for Auth", err);
            setIsLoading(false);
        });
    }, []);

    const loginAsRole = async (role: UserRole) => {
        if (!data) return;
        const candidates = data.students.filter(s => s.role === role);
        if (candidates.length > 0) {
            // Pick a random user of this role
            const randomUser = candidates[Math.floor(Math.random() * candidates.length)];
            setUser(randomUser);
            localStorage.setItem('bignap_auth_uid', String(randomUser.student_id));
        } else {
            console.warn(`No users found with role ${role}`);
        }
    };

    const loginAsUser = async (userId: number) => {
        if (!data) return;
        const found = data.students.find(s => s.student_id === userId);
        if (found) {
            setUser(found);
            localStorage.setItem('bignap_auth_uid', String(found.student_id));
        }
    };

    const updateProfile = (updates: Partial<Student>) => {
        if (!user) return;
        setUser({ ...user, ...updates });
        // Note: In a real app, we would make an API call here.
        // For now, we only update the local state.
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('bignap_auth_uid');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, loginAsRole, loginAsUser, updateProfile, logout, availableRoles }}>
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
