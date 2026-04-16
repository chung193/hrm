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
    { field: 'name', headerName: 'Name', width: 240, editable: true },
    {
        field: 'is_active',
        headerName: 'Status',
        width: 140,
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
        field: 'created_at',
        headerName: 'Created At',
        width: 200,
        renderCell: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
    {
        field: 'updated_at',
        headerName: 'Updated At',
        width: 200,
        renderCell: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
];

export default getColumns;
