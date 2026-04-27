// src/components/admin/UserTable.tsx
import { useMemo, useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    type ColumnDef,
    flexRender,
    type SortingState,
} from '@tanstack/react-table';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loader from '@/components/common/Loader';
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react'; // for sorting icons

// User interface (no email, has username)
interface User {
    _id: string;
    name: string;
    username: string;
    role: 'car_owner' | 'garage_owner' | 'admin';
    phone?: string;
    isActive: boolean;
    createdAt: string;
}

interface UserTableProps {
    users: User[];
    onRefresh: () => void;
}

export default function UserTable({ users, onRefresh }: UserTableProps) {
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);

    // Reset pagination when users change
    useEffect(() => {
        table.setPageIndex(0);
    }, [users]);

    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: (info) => info.getValue(),
            },
            {
                accessorKey: 'username',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Username
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
            },
            {
                accessorKey: 'phone',
                header: 'Phone',
                cell: (info) => info.getValue() || '-',
            },
            {
                accessorKey: 'role',
                header: 'Role',
                cell: (info) => (
                    <span className="capitalize font-medium">
                        {(info.getValue() as string).replace('_', ' ')}
                    </span>
                ),
            },
            {
                accessorKey: 'isActive',
                header: 'Status',
                cell: (info) => (
                    <span
                        className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            info.getValue()
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        )}
                    >
                        {info.getValue() ? 'Active' : 'Inactive'}
                    </span>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Joined',
                cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const user = row.original;
                    return (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(user._id, user.isActive)}
                            >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(user._id)}
                            >
                                Delete
                            </Button>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: users,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
    });

    const handleToggleActive = async (id: string, current: boolean) => {
        if (!confirm(`Are you sure you want to ${current ? 'deactivate' : 'activate'} this user?`)) return;
        setLoading(true);
        try {
            await api.patch(`/users/${id}/status`, { isActive: !current });
            toast.success(`User ${current ? 'deactivated' : 'activated'} successfully`);
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update user status');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        setLoading(true);
        try {
            await api.delete(`/users/${id}`);
            toast.success('User deleted successfully');
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Input
                    placeholder="Search users by name or username..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={table.getAllColumns().length} className="py-12">
                                    <div className="flex justify-center">
                                        <Loader size="lg" />
                                    </div>
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={table.getAllColumns().length} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700 dark:text-slate-300">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getPrePaginationRowModel().rows.length
                    )}{' '}
                    of {table.getPrePaginationRowModel().rows.length} users
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.previousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!table.getCanNextPage()}
                        onClick={() => table.nextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}