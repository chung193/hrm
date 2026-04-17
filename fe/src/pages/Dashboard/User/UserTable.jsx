import { useEffect, useMemo, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useGlobalContext } from '@providers/GlobalProvider';
import Toolbar from '@components/ToolBar';
import MainCard from '@components/MainCard';
import { loadListViewOptions, saveListViewOptions } from '@utils/listViewOptions';
import { getAllSimple as getDepartments } from '../Department/DepartmentServices';
import getColumns from './UserColumns.jsx';
import UserAdd from './UserAddModal.jsx';
import { getBreadcrumbs } from './UserBreadcrumb.js';
import {
    bulkDestroy,
    bulkDestroySystem,
    getAll,
    getAllSystem,
    storage,
    storageSystem,
    update,
    updateSystem,
    userExport,
    userExportSystem,
} from './UserServices.js';

const STORAGE_KEY = 'list-view-options:user';

const UserTable = ({ scopeMode = 'organization' }) => {
    const {
        showLoading,
        hideLoading,
        showNotification,
        openModal,
        closeModal,
        showConfirm,
        closeConfirm,
        organizationScope,
    } = useGlobalContext();
    const { t } = useTranslation(['dashboard', 'common']);
    const columns = useMemo(() => getColumns(t), [t]);
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
    const [departments, setDepartments] = useState([]);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [columnVisibilityModel, setColumnVisibilityModel] = useState(savedViewOptions.columnVisibilityModel);
    const [viewMode, setViewMode] = useState(savedViewOptions.viewMode);
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const [rowCount, setRowCount] = useState(0);
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: savedViewOptions.pageSize,
    });

    const breadcrumbs = getBreadcrumbs(t, scopeMode);
    const isSystemScope = scopeMode === 'system';
    const service = isSystemScope
        ? {
              getAll: getAllSystem,
              storage: storageSystem,
              bulkDestroy: bulkDestroySystem,
              userExport: userExportSystem,
              update: updateSystem,
          }
        : {
              getAll,
              storage,
              bulkDestroy,
              userExport,
              update,
          };

    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        loadData();
    }, [paginationModel, keyword, organizationScope?.selectedOrganizationId, scopeMode, departmentFilter, statusFilter]);

    useEffect(() => {
        getDepartments(isSystemScope ? { skipOrganizationScope: true } : {})
            .then((res) => {
                setDepartments(res.data?.data || []);
            })
            .catch(() => {
                setDepartments([]);
            });
    }, [isSystemScope, organizationScope?.selectedOrganizationId]);

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
            const res = await service.getAll({
                page: paginationModel.page + 1,
                per_page: paginationModel.pageSize,
                keyword,
                ...(departmentFilter ? { 'filter[department_id]': departmentFilter } : {}),
                ...(statusFilter !== '' ? { 'filter[is_active]': statusFilter } : {}),
            });

            setRows(res.data.data);
            setRowCount(res.data.meta.total);
            setSelectedRows(new Set());
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load data', 'error');
        } finally {
            hideLoading();
        }
    };

    const processRowUpdate = (newRow, oldRow) => {
        setRows((prev) => prev.map((row) => (row.id === oldRow.id ? newRow : row)));

        service.update(newRow.id, newRow)
            .then((res) => showNotification(res.data.message || 'Updated successfully', 'success'))
            .catch((err) => showNotification(err.response?.data?.message || err.message, 'error'));

        return newRow;
    };

    const handleSearch = (value) => {
        setKeyword(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    };

    const handleDepartmentFilterChange = (value) => {
        setDepartmentFilter(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    };

    const handleStatusFilterChange = (value) => {
        setStatusFilter(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    };

    const addUser = (data) => {
        showLoading();
        service.storage(data)
            .then(() => {
                showNotification('Created user successfully', 'success');
                loadData();
                closeModal();
            })
            .catch((err) => showNotification(err.response?.data?.message, 'error'))
            .finally(hideLoading);
    };

    const handleDelete = () => {
        showConfirm(
            t('pages.user.deleteConfirmTitle'),
            t('pages.user.deleteConfirmMessage', { count: selectedRows.size }),
            doDelete,
            closeModal
        );
    };

    const doDelete = async () => {
        showLoading();
        try {
            await service.bulkDestroy(Array.from(selectedRows));
            showNotification('Deleted successfully', 'success');
            closeConfirm();
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || err.message, 'error');
        } finally {
            hideLoading();
        }
    };

    const handleExportExcel = async () => {
        try {
            showLoading('Exporting file...');
            const response = await service.userExport({
                keyword,
                ...(departmentFilter ? { 'filter[department_id]': departmentFilter } : {}),
                ...(statusFilter !== '' ? { 'filter[is_active]': statusFilter } : {}),
            });

            const blob = new Blob([response.data], {
                type: response.headers['content-type'],
            });

            saveAs(blob, `user_${new Date().toISOString().split('T')[0]}.xlsx`);
            showNotification('Exported Excel successfully', 'success');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Export failed', 'error');
        } finally {
            hideLoading();
        }
    };

    return (
        <MainCard
            pageTitle={isSystemScope ? 'System User Management' : t('pages.user.title')}
            pageDescription={isSystemScope ? 'Manage users across all organizations' : t('pages.user.description')}
            breadcrumbs={breadcrumbs}
            totalCount={rowCount}
        >
            {!id && (
                <>
                    <Toolbar
                        loadData={loadData}
                        handleAdd={() =>
                            openModal(
                                t('pages.user.addUser'),
                                <UserAdd onSubmit={addUser} onClose={closeModal} scopeMode={scopeMode} />
                            )
                        }
                        deleteDisabled={selectedRows.size === 0}
                        handleDelete={handleDelete}
                        handleSearch={handleSearch}
                        handleDownload={handleExportExcel}
                        showOptionColumns={showOptionColumns}
                        columnVisibilityModel={columnVisibilityModel}
                        handleColumnVisibilityModelChange={setColumnVisibilityModel}
                        pageSize={paginationModel.pageSize}
                        handlePageSizeChange={(pageSize) =>
                            setPaginationModel((prev) => ({ ...prev, page: 0, pageSize }))
                        }
                        viewMode={viewMode}
                        handleViewModeChange={setViewMode}
                    />

                    {!isSystemScope && (
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                            <Box sx={{ minWidth: 240 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="user-department-filter-label">Department</InputLabel>
                                    <Select
                                        labelId="user-department-filter-label"
                                        label="Department"
                                        value={departmentFilter}
                                        onChange={(event) => handleDepartmentFilterChange(event.target.value)}
                                    >
                                        <MenuItem value="">All departments</MenuItem>
                                        {departments.map((department) => (
                                            <MenuItem key={department.id} value={String(department.id)}>
                                                {department.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ minWidth: 180 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="user-status-filter-label">Status</InputLabel>
                                    <Select
                                        labelId="user-status-filter-label"
                                        label="Status"
                                        value={statusFilter}
                                        onChange={(event) => handleStatusFilterChange(event.target.value)}
                                    >
                                        <MenuItem value="">All status</MenuItem>
                                        <MenuItem value="1">Active</MenuItem>
                                        <MenuItem value="0">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Stack>
                    )}

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
                        paginationMode="server"
                        columnVisibilityModel={columnVisibilityModel}
                        onColumnVisibilityModelChange={setColumnVisibilityModel}
                        rowCount={rowCount}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 15, 30, 50]}
                        loading={false}
                        processRowUpdate={processRowUpdate}
                        getRowHeight={() => 'auto'}
                        density={viewMode === 'list' ? 'comfortable' : 'standard'}
                    />
                </>
            )}
        </MainCard>
    );
};

export default UserTable;
