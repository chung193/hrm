import { Button, Chip, Stack } from '@mui/material';

const statusColorMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default',
};

const getColumns = ({ onApprove, onReject, t }) => [
    {
        field: 'stt',
        headerName: t('labels.no', { ns: 'common' }),
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
    { field: 'request_no', headerName: t('labels.requestNo', { ns: 'common' }), width: 160 },
    {
        field: 'user',
        headerName: t('labels.employee', { ns: 'common' }),
        width: 220,
        renderCell: (params) => params.value?.name || '-',
    },
    {
        field: 'department',
        headerName: t('labels.department', { ns: 'common' }),
        width: 180,
        renderCell: (params) => params.value?.name || '-',
    },
    { field: 'leave_type', headerName: t('labels.leaveType', { ns: 'common' }), width: 120, editable: true, type: 'singleSelect', valueOptions: ['annual', 'sick', 'unpaid', 'other'] },
    { field: 'start_date', headerName: t('labels.startDate', { ns: 'common' }), width: 130, editable: true },
    { field: 'end_date', headerName: t('labels.endDate', { ns: 'common' }), width: 130, editable: true },
    { field: 'total_days', headerName: t('labels.days', { ns: 'common' }), width: 90 },
    { field: 'reason', headerName: t('labels.reason', { ns: 'common' }), width: 260, editable: true },
    {
        field: 'status',
        headerName: t('labels.status', { ns: 'common' }),
        width: 130,
        renderCell: (params) => (
            <Chip label={params.value} color={statusColorMap[params.value] || 'default'} size='small' variant='outlined' />
        ),
    },
    {
        field: 'actions',
        headerName: t('labels.actions', { ns: 'common' }),
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
            <Stack direction='row' spacing={1}>
                <Button size='small' variant='outlined' color='success' onClick={() => onApprove(params.row)}>
                    {t('approve', { ns: 'common' })}
                </Button>
                <Button size='small' variant='outlined' color='error' onClick={() => onReject(params.row)}>
                    {t('reject', { ns: 'common' })}
                </Button>
            </Stack>
        ),
    },
];

export default getColumns;
