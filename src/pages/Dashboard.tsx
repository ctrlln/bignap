
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { Users, MapPin, Award, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';

export function Dashboard() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8 text-center text-muted-foreground">Loading data...</div>;

    const stats = [
        { label: 'Total Students', value: data.students.length, icon: Users, color: 'text-primary' },
        { label: 'Active Locations', value: data.locations.length, icon: MapPin, color: 'text-secondary-foreground' },
        { label: 'Certifications', value: data.certifications.length, icon: Award, color: 'text-accent-foreground' },
        { label: 'Courses', value: data.courses.length, icon: BookOpen, color: 'text-primary' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Program Overview"
                description="Welcome to the Bignap Data management dashboard."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.label}
                                </CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="min-h-[250px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <p>Activity Chart</p>
                        <span className="text-xs opacity-50">(Coming Soon)</span>
                    </div>
                </Card>
                <Card className="min-h-[250px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <p>Recent Enrolments</p>
                        <span className="text-xs opacity-50">(Coming Soon)</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
