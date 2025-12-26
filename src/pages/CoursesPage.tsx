
import { useEffect, useState } from 'react';
import type { Database } from '../types';
import { fetchData } from '../lib/api';
import { DataTable } from '../components/DataTable';

export function CoursesPage() {
    const [data, setData] = useState<Database | null>(null);

    useEffect(() => {
        fetchData().then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <DataTable
            title="Training Courses"
            data={data.courses}
            columns={[
                { header: 'Course Name', accessor: (c) => <span className="font-medium text-gray-900">{c.coursename}</span> },
                { header: 'Date', accessor: (c) => new Date(c.coursedate).toLocaleDateString() },
                { header: 'Center', accessor: (c) => c.center_name },
                {
                    header: 'Enrolled Student', accessor: (c) => {
                        const s = data.students.find(st => st.student_id === c.student_id);
                        return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
                    }
                },
            ]}
        />
    );
}
