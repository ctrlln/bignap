
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';

export function LocationsPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <DataTable
            title="Training Locations"
            data={data.locations}
            columns={[
                { header: 'ID', accessor: (l) => <span className="text-gray-400">#{l.location_id}</span> },
                { header: 'Location Name', accessor: (l) => <span className="font-medium text-gray-900">{l.location_name}</span> },
                { header: 'City', accessor: (l) => l.location_city },
                { header: 'Country', accessor: (l) => l.location_country },
                { header: 'Nursery Level', accessor: (l) => <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Level {l.nurserylevel_id}</span> },
            ]}
        />
    );
}
