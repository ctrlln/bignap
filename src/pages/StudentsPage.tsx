
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';

export function StudentsPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <DataTable
            title="Students Directory"
            data={data.students}
            columns={[
                { header: 'ID', accessor: (s) => <span className="text-gray-400">#{s.student_id}</span> },
                { header: 'Name', accessor: (s) => <span className="font-medium text-gray-900">{s.first_name} {s.last_name}</span> },
                { header: 'Email', accessor: (s) => s.email },
                { header: 'Role', accessor: (s) => <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{s.professionalrole}</span> },
                {
                    header: 'Location', accessor: (s) => {
                        const loc = data.locations.find(l => l.location_id === s.location_id);
                        return loc ? loc.location_city : 'Unknown';
                    }
                },
            ]}
        />
    );
}
