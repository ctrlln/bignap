
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from './ui/Card';

interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title?: string;
}

export function DataTable<T>({ data, columns, title }: DataTableProps<T>) {
    const [search, setSearch] = useState('');

    // Simple string search across all string values in the object
    const filteredData = data.filter((item) =>
        Object.values(item as any).some(
            (val) => typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
        )
    );

    return (
        <Card className="overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
                {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-all w-full sm:w-64"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} className="px-6 py-3 whitespace-nowrap">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredData.length > 0 ? (
                            filteredData.map((item, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                    {columns.map((col, j) => (
                                        <td key={j} className="px-6 py-3 text-foreground whitespace-nowrap">
                                            {col.accessor(item)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-muted-foreground">
                                    No results found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
