import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from './ui/Card';
import { LoadingState } from './ui/LoadingState';
import { EmptyState } from './ui/EmptyState';
import clsx from 'clsx';

interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
    className?: string; // Optional class for column specific styling
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title?: string;
    loading?: boolean;
    emptyMessage?: string;
}

export function DataTable<T>({
    data,
    columns,
    title,
    loading = false,
    emptyMessage = "No data available."
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');

    // Simple string search across all string values in the object
    const filteredData = data.filter((item) =>
        Object.values(item as any).some(
            (val) => typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
        )
    );

    return (
        <Card className="overflow-hidden border-border/60 shadow-sm">
            <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
                {title && <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full sm:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-12">
                    <LoadingState message="Fetching data..." />
                </div>
            ) : filteredData.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
                            <tr>
                                {columns.map((col, i) => (
                                    <th key={i} className={clsx("px-6 py-3 whitespace-nowrap", col.className)}>
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {filteredData.map((item, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors group">
                                    {columns.map((col, j) => (
                                        <td key={j} className={clsx("px-6 py-4 text-foreground whitespace-nowrap group-hover:text-primary transition-colors", col.className)}>
                                            {col.accessor(item)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-8">
                    <EmptyState
                        title="No results found"
                        description={search ? `No matches for "${search}"` : emptyMessage}
                    />
                </div>
            )}

            <div className="bg-muted/10 p-2 text-xs text-center text-muted-foreground border-t border-border/60">
                Showing {filteredData.length} records
            </div>
        </Card>
    );
}
