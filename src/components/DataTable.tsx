import { useState } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Card } from './ui/Card';
import { LoadingState } from './ui/LoadingState';
import { EmptyState } from './ui/EmptyState';
import clsx from 'clsx';

export interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
    className?: string; // Optional class for column specific styling
    sortable?: boolean;
    sortAccessor?: (item: T) => string | number | Date;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title?: string;
    loading?: boolean;
    emptyMessage?: string;
    defaultSort?: {
        colIndex: number;
        direction: 'asc' | 'desc';
    };
}

export function DataTable<T>({
    data,
    columns,
    title,
    loading = false,
    emptyMessage = "No data available.",
    defaultSort
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ colIndex: number, direction: 'asc' | 'desc' } | null>(defaultSort || null);

    // Simple string search across all string values in the object
    const filteredData = data.filter((item) =>
        Object.values(item as any).some(
            (val) => typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
        )
    );

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;
        const col = columns[sortConfig.colIndex];
        if (!col || !col.sortable) return 0;

        const getVal = (item: T) => {
            if (col.sortAccessor) return col.sortAccessor(item);
            // Fallback: try to use the accessor if it might return a primitive (unsafe but sometimes works if accessor returns string directly)
            // But accessor is defined as returning ReactNode. 
            // We assume sortAccessor is provided if sortable is true.
            return '';
        };

        const aVal = getVal(a);
        const bVal = getVal(b);

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleHeaderClick = (index: number) => {
        const col = columns[index];
        if (!col.sortable) return;

        setSortConfig((current) => {
            if (current?.colIndex === index) {
                // Toggle direction
                return { colIndex: index, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            // New column, default to asc
            return { colIndex: index, direction: 'asc' }; // Or desc if prefer "High to Low" as first click? User said "pressing again changes direction... sorts from high to low". Implies first click might be low to high? Or maybe user meant "pressing again ... sorts from high to low", meaning if currently low to high. 
            // Standard: First click ASC, second desc.
        });
    };

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
            ) : sortedData.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
                            <tr>
                                {columns.map((col, i) => {
                                    const isSorted = sortConfig?.colIndex === i;
                                    return (
                                        <th
                                            key={i}
                                            className={clsx(
                                                "px-6 py-3 whitespace-nowrap",
                                                col.className,
                                                col.sortable && "cursor-pointer hover:bg-muted/80 select-none group"
                                            )}
                                            onClick={() => handleHeaderClick(i)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.header}
                                                {col.sortable && (
                                                    <span className="text-muted-foreground/50">
                                                        {isSorted ? (
                                                            sortConfig.direction === 'asc' ? (
                                                                <ChevronUp size={14} className="text-foreground" />
                                                            ) : (
                                                                <ChevronDown size={14} className="text-foreground" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {sortedData.map((item, i) => (
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
                Showing {sortedData.length} records
            </div>
        </Card>
    );
}
