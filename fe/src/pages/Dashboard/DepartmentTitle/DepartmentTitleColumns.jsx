import { Chip } from '@mui/material';

const getColumns = (t) => [
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
    { field: 'department_id', headerName: t('pages.departmentTitle.table.departmentId'), width: 130, editable: true, type: 'number' },
    {
        field: 'department_name',
        headerName: t('labels.department', { ns: 'common' }),
        width: 220,
        valueGetter: (_, row) => row.department?.name || '',
    },
    { field: 'code', headerName: t('labels.code', { ns: 'common' }), width: 160, editable: true },
    { field: 'name', headerName: t('labels.name', { ns: 'common' }), width: 220, editable: true },
    {
        field: 'can_request_recruitment',
        headerName: t('pages.departmentTitle.table.canRequest'),
        width: 140,
        editable: true,
        type: 'boolean',
        renderCell: (params) => (
            <Chip label={params.value ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })} color={params.value ? 'primary' : 'default'} variant='outlined' size='small' />
        ),
    },
    {
        field: 'can_approve_leave',
        headerName: t('pages.departmentTitle.table.canApproveLeave'),
        width: 160,
        editable: true,
        type: 'boolean',
        renderCell: (params) => (
            <Chip label={params.value ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })} color={params.value ? 'secondary' : 'default'} variant='outlined' size='small' />
        ),
    },
    {
        field: 'is_active',
        headerName: t('labels.status', { ns: 'common' }),
        width: 140,
        editable: true,
        type: 'boolean',
        renderCell: (params) => (
            <Chip label={params.value ? t('active', { ns: 'common' }) : t('inactive', { ns: 'common' })} color={params.value ? 'success' : 'default'} variant='outlined' size='small' />
        ),
    },
    {
        field: 'created_at',
        headerName: t('labels.createdAt', { ns: 'common' }),
        width: 200,
        renderCell: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
];

export default getColumns;
