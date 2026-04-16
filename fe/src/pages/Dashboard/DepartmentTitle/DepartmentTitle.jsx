import { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import MainCard from '@components/MainCard';
import MetaData from '@components/MetaData';
import Toolbar from '@components/ToolBar';
import { loadListViewOptions, saveListViewOptions } from '@utils/listViewOptions';
import { useGlobalContext } from '@providers/GlobalProvider';
import DepartmentTitleAddModal from './DepartmentTitleAddModal';
import getColumns from './DepartmentTitleColumns';
import { getBreadcrumbs } from './DepartmentTitleBreadcrumb';
import { bulkDestroy, getAll, storage, update } from './DepartmentTitleServices';
import { getAllSimple as getAllDepartments } from '@pages/Dashboard/Department/DepartmentServices';

const STORAGE_KEY = 'list-view-options:department-title';

const DepartmentTitle = () => {
    const { showLoading, hideLoading, showNotification, openModal, closeModal, showConfirm, closeConfirm } = useGlobalContext();
    const columns = useMemo(() => getColumns(), []);
    const breadcrumbs = getBreadcrumbs();

    const showOptionColumns = useMemo(
        () =>
            columns
                .filter((column) => Boolean(column.field))
                .map((column) => ({
                    field: column.field,
                    label: typeof column.headerName === 'string' ? column.headerName : column.field,
                })),
        [columns]
    );

    const savedViewOptions = useMemo(
        () =>
            loadListViewOptions(STORAGE_KEY, {
                columnVisibilityModel: {},
                pageSize: 15,
                viewMode: 'grid',
            }),
        []
    );

    const [rows, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [columnVisibilityModel, setColumnVisibilityModel] = useState(savedViewOptions.columnVisibilityModel);
    const [viewMode, setViewMode] = useState(savedViewOptions.viewMode);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: savedViewOptions.pageSize,
    });
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        loadData();
    }, [paginationModel, keyword]);

    useEffect(() => {
        saveListViewOptions(STORAGE_KEY, {
            columnVisibilityModel,
            pageSize: paginationModel.pageSize,
            viewMode,
        });
    }, [columnVisibilityModel, paginationModel.pageSize, viewMode]);

    const loadData = async () => {
        showLoading();
        try {
            const res = await getAll({
                page: paginationModel.page + 1,
                per_page: paginationModel.pageSize,
                keyword,
            });

            setRows(res.data.data);
            setRowCount(res.data.meta.total);
            setSelectedRows(new Set());
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load department titles', 'error');
        } finally {
            hideLoading();
        }
    };

    const processRowUpdate = (newRow, oldRow) => {
        setRows((prev) => prev.map((row) => (row.id === oldRow.id ? newRow : row)));

        update(newRow.id, newRow)
            .then(() => showNotification('Updated successfully', 'success'))
            .catch((err) => showNotification(err.response?.data?.message || err.message, 'error'));

        return newRow;
    };

    const handleSearch = (value) => {
        setKeyword(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    };

    const handleAdd = async () => {
        showLoading();
        try {
            const depRes = await getAllDepartments();
            const departments = depRes.data.data || [];

            openModal(
                'Add Department Title',
                <DepartmentTitleAddModal
                    departments={departments}
                    onSubmit={(data) => {
                        showLoading();
                        storage(data)
                            .then(() => {
                                showNotification('Created successfully', 'success');
                                loadData();
                                closeModal();
                            })
                            .catch((err) => showNotification(err.response?.data?.message || 'Create failed', 'error'))
                            .finally(hideLoading);
                    }}
                    onClose={closeModal}
                />
            );
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load departments', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleDelete = () => {
        showConfirm(
            'Confirm deletion',
            `Delete ${selectedRows.size} department title(s)?`,
            async () => {
                showLoading();
                try {
                    await bulkDestroy(Array.from(selectedRows));
                    showNotification('Deleted successfully', 'success');
                    closeConfirm();
                    loadData();
                } catch (err) {
                    showNotification(err.response?.data?.message || err.message, 'error');
                } finally {
                    hideLoading();
                }
            },
            closeConfirm
        );
    };

    return (
        <MainCard breadcrumbs={breadcrumbs} totalCount={rowCount}>
            <MetaData title='Department Title Management' description='Department title management page' />

            <Toolbar
                loadData={loadData}
                handleAdd={handleAdd}
                deleteDisabled={selectedRows.size === 0}
                handleDelete={handleDelete}
                handleSearch={handleSearch}
                showDownload={false}
                showOptionColumns={showOptionColumns}
                columnVisibilityModel={columnVisibilityModel}
                handleColumnVisibilityModelChange={setColumnVisibilityModel}
                pageSize={paginationModel.pageSize}
                handlePageSizeChange={(pageSize) => setPaginationModel((prev) => ({ ...prev, page: 0, pageSize }))}
                viewMode={viewMode}
                handleViewModeChange={setViewMode}
            />

            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={(newSelection) => { const ids = Array.isArray(newSelection) ? newSelection : newSelection?.ids || []; setSelectedRows(new Set(ids)); }}
                pagination
                paginationMode='server'
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={setColumnVisibilityModel}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 15, 30, 50]}
                processRowUpdate={processRowUpdate}
                getRowHeight={() => 'auto'}
                density={viewMode === 'list' ? 'comfortable' : 'standard'}
            />
        </MainCard>
    );
};

export default DepartmentTitle;


