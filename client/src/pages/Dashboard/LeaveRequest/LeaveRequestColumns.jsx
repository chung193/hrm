import { Button, Chip, Stack } from '@mui/material';

const statusColorMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default',
};

const getColumns = ({ onApprove, onReject }) => [
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
        field: 'user',
        headerName: 'Employee',
        width: 220,
        renderCell: (params) => params.value?.name || '-',
    },
    {
        field: 'department',
        headerName: 'Department',
        width: 180,
        renderCell: (params) => params.value?.name || '-',
    },
    { field: 'leave_type', headerName: 'Type', width: 120, editable: true, type: 'singleSelect', valueOptions: ['annual', 'sick', 'unpaid', 'other'] },
    { field: 'start_date', headerName: 'Start Date', width: 130, editable: true },
    { field: 'end_date', headerName: 'End Date', width: 130, editable: true },
    { field: 'total_days', headerName: 'Days', width: 90 },
    { field: 'reason', headerName: 'Reason', width: 260, editable: true },
    {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: (params) => (
            <Chip label={params.value} color={statusColorMap[params.value] || 'default'} size='small' variant='outlined' />
        ),
    },
    {
        field: 'actions',
        headerName: 'Actions',
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
            <Stack direction='row' spacing={1}>
                <Button size='small' variant='outlined' color='success' onClick={() => onApprove(params.row)}>
                    Approve
                </Button>
                <Button size='small' variant='outlined' color='error' onClick={() => onReject(params.row)}>
                    Reject
                </Button>
            </Stack>
        ),
    },
];

export default getColumns;

