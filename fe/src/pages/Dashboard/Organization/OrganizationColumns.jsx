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
    { field: 'code', headerName: t('labels.code', { ns: 'common' }), width: 160, editable: true },
    { field: 'name', headerName: t('labels.name', { ns: 'common' }), width: 240, editable: true },
    {
        field: 'is_active',
        headerName: t('labels.status', { ns: 'common' }),
        width: 140,
        type: 'boolean',
        editable: true,
        renderCell: (params) => (
            <Chip
                label={params.value ? t('active', { ns: 'common' }) : t('inactive', { ns: 'common' })}
                color={params.value ? 'success' : 'default'}
                variant='outlined'
                size='small'
            />
        ),
    },
    {
        field: 'created_at',
        headerName: t('labels.createdAt', { ns: 'common' }),
        width: 200,
        renderCell: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
    {
        field: 'updated_at',
        headerName: t('labels.updatedAt', { ns: 'common' }),
        width: 200,
        renderCell: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
];

export default getColumns;
