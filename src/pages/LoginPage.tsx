import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { LogIn, Info } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background elements for visual interest */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-secondary/50 rounded-full blur-3xl" />

            <div className="relative w-full max-w-md">

                {/* Main Login Card */}
                <div className="w-full bg-card border border-border rounded-xl p-8 shadow-xl z-10 relative">
                    <div className="flex flex-col items-center mb-8">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                            <LogIn size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Bignap Login</h1>
                        <p className="text-muted-foreground">Sign in to access your account</p>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </div>

                {/* Sticky Note for Test Accounts */}
                <div className="md:absolute md:left-[calc(100%+2rem)] md:top-8 w-80 relative mt-8 md:mt-0 group md:-rotate-2 hover:rotate-0 transition-transform duration-300 z-0">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-sm transform translate-y-2 translate-x-2 rounded-sm" />
                    <div className="bg-yellow-200 text-yellow-900 p-6 w-80 shadow-lg relative rounded-sm border-t-8 border-yellow-300/50">
                        {/* Tape effect */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-[1px] rotate-[-2deg] shadow-sm transform" />

                        <div className="flex items-center gap-2 mb-3 border-b border-yellow-800/20 pb-2">
                            <Info size={16} className="text-yellow-800" />
                            <span className="font-bold text-sm uppercase tracking-wider">Demo Credentials</span>
                        </div>

                        <p className="text-xs mb-3 font-medium opacity-80">Use these accounts to test different roles (Password: <strong>password123</strong>)</p>

                        <div className="space-y-2 text-xs font-mono">
                            <div
                                className="cursor-pointer hover:bg-yellow-300/50 p-1.5 rounded transition-colors"
                                onClick={() => setEmail('verna.schamberger@test.local')}
                            >
                                <span className="font-bold block text-yellow-950">Admin</span>
                                <span className="opacity-95 select-all">verna.schamberger@test.local</span>
                            </div>
                            <div
                                className="cursor-pointer hover:bg-yellow-300/50 p-1.5 rounded transition-colors"
                                onClick={() => setEmail('luther.jacobs@test.local')}
                            >
                                <span className="font-bold block text-yellow-950">Master Trainer</span>
                                <span className="opacity-95 select-all">luther.jacobs@test.local</span>
                            </div>
                            <div
                                className="cursor-pointer hover:bg-yellow-300/50 p-1.5 rounded transition-colors"
                                onClick={() => setEmail('gayle.harvey@test.local')}
                            >
                                <span className="font-bold block text-yellow-950">Trainer</span>
                                <span className="opacity-95 select-all">gayle.harvey@test.local</span>
                            </div>
                            <div
                                className="cursor-pointer hover:bg-yellow-300/50 p-1.5 rounded transition-colors"
                                onClick={() => setEmail('Werner69@hotmail.com')}
                            >
                                <span className="font-bold block text-yellow-950">Student</span>
                                <span className="opacity-95 select-all">Werner69@hotmail.com</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
