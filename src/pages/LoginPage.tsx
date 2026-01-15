import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { LogIn } from 'lucide-react';

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('verna.schamberger@test.local');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
                        <LogIn size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Bignap Login</h1>
                    <p className="text-slate-400">Sign in to access your account</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400">
                    <p className="mb-2 font-semibold">Test Accounts (password: password123):</p>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded border border-slate-800">
                            <span className="text-emerald-400">Admin</span>
                            <code>verna.schamberger@test.local</code>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded border border-slate-800">
                            <span className="text-blue-400">Master</span>
                            <code>luther.jacobs@test.local</code>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded border border-slate-800">
                            <span className="text-yellow-400">Trainer</span>
                            <code>gayle.harvey@test.local</code>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded border border-slate-800">
                            <span className="text-slate-400">Student (w/ Certs)</span>
                            <code>Werner69@hotmail.com</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
