import { useEffect, useState } from 'react';
import type { Degree } from '../lib/data/types';
import { fetchDegrees } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/ui/PageHeader';

export function DegreesPage() {
    const [degrees, setDegrees] = useState<Degree[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDegrees()
            .then(setDegrees)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Student Degrees" description="Academic backgrounds of enrolled students." />

            <DataTable
                data={degrees}
                columns={[
                    { header: 'Degree', accessor: (d) => <span className="font-bold text-foreground">{d.degree}</span>, sortable: true, sortAccessor: (d) => d.degree },
                    { header: 'Discipline', accessor: (d) => d.discipline, sortable: true, sortAccessor: (d) => d.discipline },
                    {
                        header: 'Trainee', accessor: (d) => d.first_name && d.last_name
                            ? `${d.first_name} ${d.last_name}`
                            : 'Unknown',
                        sortable: true,
                        sortAccessor: (d) => `${d.first_name || ''} ${d.last_name || ''}`
                    },
                ]}
            />
        </div>
    );
}
