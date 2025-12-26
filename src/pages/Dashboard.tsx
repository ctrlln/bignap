
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { Users, MapPin, Award, BookOpen } from 'lucide-react';

export function Dashboard() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8 text-center text-gray-500">Loading data...</div>;

    const stats = [
        { label: 'Total Students', value: data.students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Locations', value: data.locations.length, icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Certifications Awarded', value: data.certifications.length, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Courses Scheduled', value: data.courses.length, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Program Overview</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <Icon className={stat.color} size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Placeholder for charts or recent activity */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-64 flex items-center justify-center text-gray-400">
                    Activity Chart Placeholder
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-64 flex items-center justify-center text-gray-400">
                    Recent Enrolments
                </div>
            </div>
        </div>
    );
}
