
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/ui/PageHeader';

export function DegreesPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Student Degrees" description="Academic backgrounds of enrolled students." />

            <DataTable
                data={data.degrees}
                columns={[
                    { header: 'Degree', accessor: (d) => <span className="font-bold text-foreground">{d.degree}</span> },
                    { header: 'Discipline', accessor: (d) => d.discipline },
                    {
                        header: 'Student', accessor: (d) => {
                            const s = data.students.find(st => st.student_id === d.student_id);
                            return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
                        }
                    },
                ]}
            />
        </div>
    );
}
