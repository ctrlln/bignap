import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { FeedbackTrigger } from './feedback/FeedbackTrigger';
import { FeedbackDrawer } from './feedback/FeedbackDrawer';
import { SidebarContent } from './SidebarContent';
import { Button } from './ui/Button';

export function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-30">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Bignap Data
                </h1>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-20 md:hidden pt-16 bg-background/80 backdrop-blur-sm">
                    <div className="w-64 h-full bg-card border-r border-border shadow-2xl">
                        <SidebarContent onNavigate={() => setIsMobileMenuOpen(false)} />
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setIsMobileMenuOpen(false)} />
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-muted/20 relative pt-16 md:pt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
                <FeedbackTrigger />
                <FeedbackDrawer />
            </main>
        </div>
    );
}
