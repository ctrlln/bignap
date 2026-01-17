import { useEffect, useState } from 'react';
import type { TrainingEvent } from '../lib/data/types';
import { fetchEvents } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/ui/PageHeader';

export function CoursesPage() {
    const [events, setEvents] = useState<TrainingEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents()
            .then(data => setEvents(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Training Courses" description="Scheduled training sessions and workshops." />

            <DataTable
                data={events}
                columns={[
                    { header: 'Type', accessor: (c) => <span className="font-medium text-foreground">{c.course_type}</span>, sortable: true, sortAccessor: (c) => c.course_type },
                    { header: 'Start Date', accessor: (c) => new Date(c.start_date).toLocaleDateString(), sortable: true, sortAccessor: (c) => new Date(c.start_date).getTime() },
                    { header: 'End Date', accessor: (c) => new Date(c.end_date).toLocaleDateString(), sortable: true, sortAccessor: (c) => new Date(c.end_date).getTime() },
                    { header: 'Center', accessor: (c) => c.center_name || 'N/A', sortable: true, sortAccessor: (c) => c.center_name || '' },
                    { header: 'Lead Trainer', accessor: (c) => c.lead_trainer_name || 'N/A', sortable: true, sortAccessor: (c) => c.lead_trainer_name || '' },
                ]}
                defaultSort={{ colIndex: 1, direction: 'desc' }}
            />
        </div>
    );
}
