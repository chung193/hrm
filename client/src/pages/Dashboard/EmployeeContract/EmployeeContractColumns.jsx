import { Chip } from '@mui/material';

const statusColorMap = {
    draft: 'default',
    active: 'success',
    expired: 'warning',
    terminated: 'error',
};

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
    {
        field: 'user',
        headerName: 'Employee',
        width: 220,
        editable: false,
        renderCell: (params) => params.value?.name || '-',
    },
    {
        field: 'contract_type',
        headerName: 'Contract Type',
        width: 200,
        editable: false,
        renderCell: (params) => params.value?.name || '-',
    },
    { field: 'contract_no', headerName: 'Contract No', width: 170, editable: true },
    { field: 'start_date', headerName: 'Start Date', width: 130, editable: true },
    { field: 'end_date', headerName: 'End Date', width: 130, editable: true },
    { field: 'signed_date', headerName: 'Signed Date', width: 130, editable: true },
    {
        field: 'status',
        headerName: 'Status',
        width: 130,
        editable: true,
        type: 'singleSelect',
        valueOptions: ['draft', 'active', 'expired', 'terminated'],
        renderCell: (params) => (
            <Chip label={params.value || 'draft'} color={statusColorMap[params.value] || 'default'} variant='outlined' size='small' />
        ),
    },
    {
        field: 'is_active',
        headerName: 'Current',
        width: 120,
        type: 'boolean',
        editable: true,
        renderCell: (params) => (
            <Chip
                label={params.value ? 'Yes' : 'No'}
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

