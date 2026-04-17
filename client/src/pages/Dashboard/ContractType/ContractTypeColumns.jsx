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
    { field: 'code', headerName: 'Code', width: 160, editable: true },
    { field: 'name', headerName: 'Name', width: 220, editable: true },
    { field: 'duration_months', headerName: 'Duration (months)', width: 170, editable: true, type: 'number' },
    {
        field: 'is_probation',
        headerName: 'Probation',
        width: 130,
        type: 'boolean',
        editable: true,
        renderCell: (params) => (
            <Chip
                label={params.value ? 'Yes' : 'No'}
                color={params.value ? 'warning' : 'default'}
                variant='outlined'
                size='small'
            />
        ),
    },
    {
        field: 'is_indefinite',
        headerName: 'Indefinite',
        width: 130,
        type: 'boolean',
        editable: true,
        renderCell: (params) => (
            <Chip
                label={params.value ? 'Yes' : 'No'}
                color={params.value ? 'info' : 'default'}
                variant='outlined'
                size='small'
            />
        ),
    },
    {
        field: 'is_active',
        headerName: 'Status',
        width: 120,
        type: 'boolean',
        editable: true,
        renderCell: (params) => (
            <Chip
                label={params.value ? 'Active' : 'Inactive'}
                color={params.value ? 'success' : 'default'}
                variant='outlined'
                size='small'
            />
        ),
    },
    {
        field: 'updated_at',
        headerName: 'Updated At',
        width: 200,
        renderCell: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
];

export default getColumns;

