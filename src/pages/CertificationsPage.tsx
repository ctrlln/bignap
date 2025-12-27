
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';

export function CertificationsPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Certifications" description="Professional certifications awarded to students." />

            <DataTable
                data={data.certifications}
                columns={[
                    { header: 'Certification', accessor: (c) => <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">{c.certification}</Badge> },
                    { header: 'Date Awarded', accessor: (c) => new Date(c.certification_date).toLocaleDateString() },
                    {
                        header: 'Student', accessor: (c) => {
                            const s = data.students.find(st => st.student_id === c.student_id);
                            return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
                        }
                    },
                ]}
            />
        </div>
    );
}
