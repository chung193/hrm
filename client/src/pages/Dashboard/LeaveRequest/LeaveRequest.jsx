import { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import MainCard from '@components/MainCard';
import MetaData from '@components/MetaData';
import Toolbar from '@components/ToolBar';
import { loadListViewOptions, saveListViewOptions } from '@utils/listViewOptions';
import { useGlobalContext } from '@providers/GlobalProvider';
import LeaveRequestAddModal from './LeaveRequestAddModal';
import getColumns from './LeaveRequestColumns';
import { getBreadcrumbs } from './LeaveRequestBreadcrumb';
import { approve, bulkDestroy, getAll, reject, storage, update } from './LeaveRequestServices';

const STORAGE_KEY = 'list-view-options:leave-request';

const LeaveRequest = () => {
    const { showLoading, hideLoading, showNotification, openModal, closeModal, showConfirm, closeConfirm } = useGlobalContext();
    const breadcrumbs = getBreadcrumbs();
    const [rows, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [rowCount, setRowCount] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 15 });

    const savedViewOptions = useMemo(
        () =>
            loadListViewOptions(STORAGE_KEY, {
                columnVisibilityModel: {},
                pageSize: 15,
                viewMode: 'grid',
            }),
        []
    );

    useEffect(() => {
        setColumnVisibilityModel(savedViewOptions.columnVisibilityModel);
        setPaginationModel((prev) => ({ ...prev, pageSize: savedViewOptions.pageSize }));
        setViewMode(savedViewOptions.viewMode);
    }, []);

    const loadData = async () => {
        showLoading();
        try {
            const res = await getAll({
                page: paginationModel.page + 1,
                per_page: paginationModel.pageSize,
                keyword,
                include: 'user,department,departmentTitle,approver',
            });

            setRows(res.data.data || []);
            setRowCount(res.data.meta?.total || 0);
            setSelectedRows(new Set());
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load leave requests', 'error');
        } finally {
            hideLoading();
        }
    };

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

    const handleSearch = (value) => {
        setKeyword(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    };

    const handleAdd = () => {
        openModal(
            'Create Leave Request',
            <LeaveRequestAddModal
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
    };

    const handleApprove = async (row) => {
        showLoading();
        try {
            await approve(row.id);
            showNotification('Approved successfully', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Approve failed', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleReject = async (row) => {
        const reason = window.prompt('Rejection reason');
        if (!reason) {
            return;
        }

        showLoading();
        try {
            await reject(row.id, reason);
            showNotification('Rejected successfully', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Reject failed', 'error');
        } finally {
            hideLoading();
        }
    };

    const columns = useMemo(() => getColumns({ onApprove: handleApprove, onReject: handleReject }), []);

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

    const processRowUpdate = (newRow, oldRow) => {
        setRows((prev) => prev.map((row) => (row.id === oldRow.id ? newRow : row)));
        update(newRow.id, {
            leave_type: newRow.leave_type,
            start_date: newRow.start_date,
            end_date: newRow.end_date,
            reason: newRow.reason,
        })
            .then(() => showNotification('Updated successfully', 'success'))
            .catch((err) => showNotification(err.response?.data?.message || 'Update failed', 'error'));

        return newRow;
    };

    const handleDelete = () => {
        showConfirm(
            'Confirm deletion',
            `Delete ${selectedRows.size} leave request(s)?`,
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
        <MainCard breadcrumbs={breadcrumbs}>
            <MetaData title='Leave Requests' description='Leave requests management' />

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
                onRowSelectionModelChange={(newSelection) => {
                    const ids = Array.isArray(newSelection) ? newSelection : newSelection?.ids || [];
                    setSelectedRows(new Set(ids));
                }}
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

export default LeaveRequest;

