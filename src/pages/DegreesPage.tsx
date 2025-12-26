
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';

export function DegreesPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <DataTable
            title="Student Degrees"
            data={data.degrees}
            columns={[
                { header: 'Degree', accessor: (d) => <span className="font-bold text-gray-700">{d.degree}</span> },
                { header: 'Discipline', accessor: (d) => d.discipline },
                {
                    header: 'Student', accessor: (d) => {
                        const s = data.students.find(st => st.student_id === d.student_id);
                        return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
                    }
                },
            ]}
        />
    );
}
