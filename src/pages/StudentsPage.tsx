import { useEffect, useState } from 'react';
import type { User } from '../lib/data/types';
import { fetchUsers } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plus, Mail } from 'lucide-react';

export function StudentsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers()
            .then(setUsers)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader title="User Directory" description="Manage system users and their roles.">
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </PageHeader>

            <DataTable
                data={users}
                loading={loading}
                emptyMessage="No users found."
                columns={[
                    {
                        header: 'Name',
                        accessor: (s) => (
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                    {s.first_name[0]}{s.last_name[0]}
                                </div>
                                <span className="font-medium text-foreground">{s.first_name} {s.last_name}</span>
                            </div>
                        )
                    },
                    {
                        header: 'Email',
                        accessor: (s) => (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail size={14} />
                                {s.email}
                            </div>
                        )
                    },
                    {
                        header: 'Roles',
                        accessor: (s) => (
                            <div className="flex gap-1 flex-wrap">
                                {Array.isArray(s.roles) ? s.roles.map(r => (
                                    <Badge key={r} variant={r === 'student' ? 'secondary' : 'default'} className="capitalize">
                                        {r.replace('_', ' ')}
                                    </Badge>
                                )) : <Badge variant="destructive">Invalid Roles</Badge>}
                            </div>
                        )
                    },
                    { header: 'Joined', accessor: (s) => s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A' },
                ]}
            />
        </div>
    );
}
