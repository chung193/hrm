import { Button, Chip, Stack } from '@mui/material';

const statusColorMap = {
    pending: 'default',
    received: 'info',
    recruiting: 'warning',
    interviewing: 'secondary',
    hired: 'success',
};

const getColumns = ({ onReceive, onSetHires }) => [
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
    { field: 'request_no', headerName: 'Request No', width: 160 },
    {
        field: 'requested_by',
        headerName: 'Requester',
        width: 220,
        renderCell: (params) => params.value?.name || '-',
    },
    {
        field: 'requesting_department',
        headerName: 'Department',
        width: 220,
        renderCell: (params) => params.value?.name || '-',
    },
    {
        field: 'requesting_department_title',
        headerName: 'Requester Title',
        width: 220,
        renderCell: (params) => params.value?.name || '-',
    },
    { field: 'requested_position', headerName: 'Requested Position', width: 220, editable: true },
    { field: 'quantity', headerName: 'Quantity', width: 110, editable: true, type: 'number' },
    {
        field: 'status',
        headerName: 'Status',
        width: 150,
        editable: true,
        type: 'singleSelect',
        valueOptions: ['pending', 'received', 'recruiting', 'interviewing', 'hired'],
        renderCell: (params) => (
            <Chip label={params.value} color={statusColorMap[params.value] || 'default'} variant='outlined' size='small' />
        ),
    },
    {
        field: 'hires',
        headerName: 'Hired Users',
        width: 180,
        renderCell: (params) => {
            const hires = Array.isArray(params.value) ? params.value : [];
            return hires.length;
        },
    },
    {
        field: 'actions',
        headerName: 'Actions',
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
            <Stack direction='row' spacing={1}>
                <Button size='small' variant='outlined' onClick={() => onReceive(params.row)}>
                    Receive
                </Button>
                <Button size='small' variant='outlined' onClick={() => onSetHires(params.row)}>
                    Set Hires
                </Button>
            </Stack>
        ),
    },
];

export default getColumns;

