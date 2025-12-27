
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';

export function LocationsPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Training Locations" description="Centers where training courses are held." />

            <DataTable
                data={data.locations}
                columns={[
                    { header: 'ID', accessor: (l) => <span className="text-muted-foreground">#{l.location_id}</span> },
                    { header: 'Location Name', accessor: (l) => <span className="font-medium text-foreground">{l.location_name}</span> },
                    { header: 'City', accessor: (l) => l.location_city },
                    { header: 'Country', accessor: (l) => l.location_country },
                    { header: 'Nursery Level', accessor: (l) => <Badge variant="outline">Level {l.nurserylevel_id}</Badge> },
                ]}
            />
        </div>
    );
}
