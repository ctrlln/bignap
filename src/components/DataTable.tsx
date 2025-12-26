
import { useState } from 'react';
import { Search } from 'lucide-react';

interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title: string;
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full sm:w-64"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} className="px-6 py-3 whitespace-nowrap">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredData.length > 0 ? (
                            filteredData.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    {columns.map((col, j) => (
                                        <td key={j} className="px-6 py-3 text-gray-700 whitespace-nowrap">
                                            {col.accessor(item)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                    No results found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
