
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';

export function CertificationsPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <DataTable
            title="Certifications"
            data={data.certifications}
            columns={[
                { header: 'Certification', accessor: (c) => <span className="font-medium text-emerald-700">{c.certification}</span> },
                { header: 'Date Awarded', accessor: (c) => new Date(c.certification_date).toLocaleDateString() },
                {
                    header: 'Student', accessor: (c) => {
                        const s = data.students.find(st => st.student_id === c.student_id);
                        return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
                    }
                },
            ]}
        />
    );
}
