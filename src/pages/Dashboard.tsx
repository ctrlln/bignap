import { useEffect, useState } from 'react';
import type { DashboardStats } from '../lib/data/types';
import { fetchStats } from '../lib/api';

import { useAuth } from '../contexts/AuthContext';
import { Users, MapPin, Award, BookOpen, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { DashboardMap } from '../components/DashboardMap';

export function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);

    const isAdminOrMaster = user?.roles?.some(r => ['admin', 'master_trainer'].includes(r));

    useEffect(() => {
        if (isAdminOrMaster) {
            fetchStats().then(setStats).catch(console.error);
        }
    }, [isAdminOrMaster]);

    if (!user) return null;

    if (!isAdminOrMaster) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Dashboard"
                    description={`Welcome back, ${user.first_name}!`}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/profile')}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                                <Award className="text-primary" />
                                My Certifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">View and download your NIDCAP certifications.</p>
                            <Button variant="outline" className="w-full">
                                View Profile
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/courses')}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                                <BookOpen className="text-primary" />
                                Upcoming Courses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">Check for upcoming training events near you.</p>
                            <Button variant="outline" className="w-full">
                                Browse Courses
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!stats) return <div className="p-6"><LoadingState message="Loading dashboard stats..." /></div>;

    const cards = [
        { label: 'Total Students', value: stats.students, icon: Users, color: 'text-blue-500 bg-blue-500/10', path: '/students' },
        { label: 'Active Locations', value: stats.locations, icon: MapPin, color: 'text-emerald-500 bg-emerald-500/10', path: '/locations' },
        { label: 'Certifications', value: stats.certifications, icon: Award, color: 'text-amber-500 bg-amber-500/10', path: '/certifications' },
        { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'text-purple-500 bg-purple-500/10', path: '/courses' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Program Overview"
                description="Welcome to the Bignap Data management dashboard."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={stat.label}
                            className="hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(stat.path)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.label}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.color}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    +2 since last month
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <DashboardMap />
                </div>
                <div className="space-y-6">
                    <Card className="flex flex-col h-[240px]">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <EmptyState
                                title="No recent activity"
                                description="System activity logs will appear here."
                                icon={Activity}
                            />
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col h-[240px]">
                        <CardHeader>
                            <CardTitle>Recent Enrolments</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <EmptyState
                                title="No enrolments"
                                description="New student registrations will appear here."
                                icon={Users}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
