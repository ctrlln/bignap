import { useEffect, useState } from 'react';
import type { Certification } from '../lib/data/types';
import { fetchCertifications } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';

export function CertificationsPage() {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCertifications()
            .then(setCertifications)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Certifications" description="Professional certifications awarded to students." />

            <DataTable
                data={certifications}
                columns={[
                    { header: 'Certification', accessor: (c) => <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">{c.certification_type}</Badge> },
                    { header: 'Date Awarded', accessor: (c) => new Date(c.issue_date).toLocaleDateString() },
                    {
                        header: 'Student', accessor: (c) => c.first_name && c.last_name
                            ? `${c.first_name} ${c.last_name}`
                            : 'Unknown'
                    },
                    { header: 'Center', accessor: (c) => c.issuing_center_name || 'N/A' },
                ]}
            />
        </div>
    );
}
