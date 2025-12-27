
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';

export function StudentsPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Students Directory" description="Manage enrolled students and their details.">
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Student
                </Button>
            </PageHeader>

            <DataTable
                data={data.students}
                columns={[
                    { header: 'ID', accessor: (s) => <span className="text-muted-foreground">#{s.student_id}</span> },
                    { header: 'Name', accessor: (s) => <span className="font-medium text-foreground">{s.first_name} {s.last_name}</span> },
                    { header: 'Email', accessor: (s) => s.email },
                    { header: 'Role', accessor: (s) => <Badge variant="secondary">{s.professionalrole}</Badge> },
                    {
                        header: 'Location', accessor: (s) => {
                            const loc = data.locations.find(l => l.location_id === s.location_id);
                            return loc ? loc.location_city : 'Unknown';
                        }
                    },
                ]}
            />
        </div>
    );
}
