import MainCard from '@components/MainCard';
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';


const getColumns = (t) => [
    { field: 'id', headerName: 'ID', width: 90 },
    {
        field: 'firstName',
        headerName: t('pages.dataTables.firstName'),
        width: 150,
        editable: true,
    },
    {
        field: 'lastName',
        headerName: t('pages.dataTables.lastName'),
        width: 150,
        editable: true,
    },
    {
        field: 'age',
        headerName: t('pages.dataTables.age'),
        type: 'number',
        width: 110,
        editable: true,
    },
    {
        field: 'fullName',
        headerName: t('pages.dataTables.fullName'),
        description: t('pages.dataTables.fullNameDescription'),
        sortable: false,
        width: 160,
        valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
    },
];

const rows = [
    { id: 1, lastName: 'Snow', firstName: 'Jon', age: 14 },
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 31 },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 31 },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 11 },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
    { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
    { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
];

export default function DataTables() {
    const { t } = useTranslation('dashboard');
    const columns = useMemo(() => getColumns(t), [t]);

    return (
        <MainCard
            pageTitle={t('pages.dataTables.title')}
            pageDescription={t('pages.dataTables.description')}
        >
            <Box sx={{ height: 'auto', width: '100%' }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant='h6'>{t('pages.dataTables.defaultTitle')}</Typography>
                    <Typography>{t('pages.dataTables.defaultDescription')}</Typography>
                </Box>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 5,
                            },
                        },
                    }}
                    pageSizeOptions={[5]}
                    checkboxSelection
                    disableRowSelectionOnClick
                />
            </Box>
        </MainCard>
    );
}
