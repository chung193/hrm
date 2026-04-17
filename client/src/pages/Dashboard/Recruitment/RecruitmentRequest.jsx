import { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import MainCard from '@components/MainCard';
import MetaData from '@components/MetaData';
import Toolbar from '@components/ToolBar';
import { loadListViewOptions, saveListViewOptions } from '@utils/listViewOptions';
import { useGlobalContext } from '@providers/GlobalProvider';
import { getBreadcrumbs } from './RecruitmentRequestBreadcrumb';
import RecruitmentRequestAddModal from './RecruitmentRequestAddModal';
import RecruitmentSetHiresModal from './RecruitmentSetHiresModal';
import getColumns from './RecruitmentRequestColumns';
import { bulkDestroy, getAll, receive, storage, update, updateStatus } from './RecruitmentRequestServices';
import { getAllSimple as getAllUsers } from '../User/UserServices';

const STORAGE_KEY = 'list-view-options:recruitment-request';

const RecruitmentRequest = () => {
    const { showLoading, hideLoading, showNotification, openModal, closeModal, showConfirm, closeConfirm } = useGlobalContext();
    const [rows, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [allUsers, setAllUsers] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 15 });
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const breadcrumbs = getBreadcrumbs();

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
                include: 'requestedBy,requestingDepartment,requestingDepartmentTitle,receivedBy,hires.user',
            });

            setRows(res.data.data || []);
            setRowCount(res.data.meta?.total || 0);
            setSelectedRows(new Set());
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load recruitment requests', 'error');
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

    useEffect(() => {
        getAllUsers().then((res) => setAllUsers(res.data?.data || [])).catch(() => {});
    }, []);

    const handleSearch = (value) => {
        setKeyword(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    };

    const handleAdd = () => {
        openModal(
            'Create Recruitment Request',
            <RecruitmentRequestAddModal
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

    const handleReceive = async (row) => {
        showLoading();
        try {
            await receive(row.id);
            showNotification('Request marked as received', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to mark as received', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleSetHires = (row) => {
        const defaultHires = Array.isArray(row.hires) ? row.hires.map((item) => item.user_id) : [];
        openModal(
            `Set hired users for ${row.request_no}`,
            <RecruitmentSetHiresModal
                users={allUsers}
                defaultHires={defaultHires}
                onSubmit={(payload) => {
                    showLoading();
                    updateStatus(row.id, {
                        status: 'hired',
                        ...payload,
                    })
                        .then(() => {
                            showNotification('Hired users updated', 'success');
                            loadData();
                            closeModal();
                        })
                        .catch((err) => showNotification(err.response?.data?.message || 'Failed to update hired users', 'error'))
                        .finally(hideLoading);
                }}
                onClose={closeModal}
            />
        );
    };

    const columns = useMemo(() => getColumns({ onReceive: handleReceive, onSetHires: handleSetHires }), [rows, allUsers]);

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

        const statusChanged = newRow.status !== oldRow.status;
        if (statusChanged) {
            updateStatus(newRow.id, { status: newRow.status })
                .then(() => showNotification('Status updated', 'success'))
                .catch((err) => showNotification(err.response?.data?.message || 'Failed to update status', 'error'));
        } else {
            update(newRow.id, {
                requested_position: newRow.requested_position,
                quantity: newRow.quantity,
                reason: newRow.reason,
                note: newRow.note,
                is_active: newRow.is_active,
            })
                .then(() => showNotification('Updated successfully', 'success'))
                .catch((err) => showNotification(err.response?.data?.message || 'Update failed', 'error'));
        }

        return newRow;
    };

    const handleDelete = () => {
        showConfirm(
            'Confirm deletion',
            `Delete ${selectedRows.size} recruitment request(s)?`,
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
            <MetaData title='Recruitment Requests' description='Recruitment requests management' />

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

export default RecruitmentRequest;

