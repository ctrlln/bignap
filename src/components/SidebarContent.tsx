
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MapPin,
    Award,
    BookOpen
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Users', path: '/trainees', icon: Users },
    { name: 'Locations', path: '/locations', icon: MapPin },
    // { name: 'Degrees', path: '/degrees', icon: GraduationCap }, // Removed per request
    { name: 'Certifications', path: '/certifications', icon: Award },
    { name: 'Courses', path: '/courses', icon: BookOpen },
];

function UserBadge() {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <Link to="/profile" className="flex items-center gap-3 text-xs bg-muted/50 p-2 rounded-md border border-border/50 hover:bg-muted transition-colors group">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold group-hover:bg-primary/30 transition-colors">
                {user.first_name[0]}{user.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-foreground">{user.first_name} {user.last_name}</p>
                <p className="text-muted-foreground capitalize truncate">{user.roles?.map(r => r.replace('_', ' ')).join(', ') || 'Trainee'}</p>
            </div>
        </Link>
    );
}

// Import LogOut icon
import { LogOut } from 'lucide-react';

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border space-y-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Bignap Data
                </h1>
                <UserBadge />
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <Icon size={18} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Footer - Bottom Left */}
            <div className="p-4 border-t border-border mt-auto">
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <LogOut size={18} />
                    Log Out
                </button>
            </div>
        </div>
    );
}
