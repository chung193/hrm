import { Chip } from '@mui/material';

const getColumns = () => [
    {
        field: 'stt',
        headerName: 'No.',
        width: 80,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
            const paginationModel = params.api.state.pagination?.paginationModel;
            const page = paginationModel?.page ?? 0;
            const pageSize = paginationModel?.pageSize ?? 0;
            const indexInPage = params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
            return page * pageSize + indexInPage;
        },
    },
    { field: 'department_id', headerName: 'Department ID', width: 130, editable: true, type: 'number' },
    {
        field: 'department_name',
        headerName: 'Department',
        width: 220,
        valueGetter: (_, row) => row.department?.name || '',
    },
    { field: 'code', headerName: 'Code', width: 160, editable: true },
    { field: 'name', headerName: 'Name', width: 220, editable: true },
    {
        field: 'can_request_recruitment',
        headerName: 'Can Request',
        width: 140,
        editable: true,
        type: 'boolean',
        renderCell: (params) => (
            <Chip label={params.value ? 'Yes' : 'No'} color={params.value ? 'primary' : 'default'} variant='outlined' size='small' />
        ),
    },
    {
        field: 'can_approve_leave',
        headerName: 'Can Approve Leave',
        width: 160,
        editable: true,
        type: 'boolean',
        renderCell: (params) => (
            <Chip label={params.value ? 'Yes' : 'No'} color={params.value ? 'secondary' : 'default'} variant='outlined' size='small' />
        ),
    },
    {
        field: 'is_active',
        headerName: 'Status',
        width: 140,
        editable: true,
        type: 'boolean',
        renderCell: (params) => (
            <Chip label={params.value ? 'Active' : 'Inactive'} color={params.value ? 'success' : 'default'} variant='outlined' size='small' />
        ),
    },
    {
        field: 'created_at',
        headerName: 'Created At',
        width: 200,
        renderCell: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
];

export default getColumns;
