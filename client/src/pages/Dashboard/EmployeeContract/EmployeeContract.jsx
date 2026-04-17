import { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import MainCard from '@components/MainCard';
import MetaData from '@components/MetaData';
import Toolbar from '@components/ToolBar';
import { loadListViewOptions, saveListViewOptions } from '@utils/listViewOptions';
import { useGlobalContext } from '@providers/GlobalProvider';
import EmployeeContractAddModal from './EmployeeContractAddModal';
import getColumns from './EmployeeContractColumns';
import { getBreadcrumbs } from './EmployeeContractBreadcrumb';
import { bulkDestroy, getAll, storage, update } from './EmployeeContractServices';
import { getAllSimple as getAllUsers } from '../User/UserServices';
import { getAllSimple as getAllContractTypes } from '../ContractType/ContractTypeServices';

const STORAGE_KEY = 'list-view-options:employee-contract';

const EmployeeContract = () => {
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
                include: 'user,contractType',
            });

            setRows(res.data.data);
            setRowCount(res.data.meta.total);
            setSelectedRows(new Set());
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load employee contracts', 'error');
        } finally {
            hideLoading();
        }
    };

    const processRowUpdate = (newRow, oldRow) => {
        setRows((prev) => prev.map((row) => (row.id === oldRow.id ? newRow : row)));

        const payload = {
            contract_no: newRow.contract_no,
            start_date: newRow.start_date,
            end_date: newRow.end_date,
            signed_date: newRow.signed_date,
            status: newRow.status,
            is_active: newRow.is_active,
        };

        update(newRow.id, payload)
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
            const [usersRes, contractTypesRes] = await Promise.all([getAllUsers(), getAllContractTypes()]);
            const users = usersRes.data?.data || [];
            const contractTypes = contractTypesRes.data?.data || [];

            openModal(
                'Add Employee Contract',
                <EmployeeContractAddModal
                    users={users}
                    contractTypes={contractTypes}
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
            showNotification(err.response?.data?.message || 'Failed to load form data', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleDelete = () => {
        showConfirm(
            'Confirm deletion',
            `Delete ${selectedRows.size} employee contract(s)?`,
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
            <MetaData title='Employee Contract Management' description='Employee contract management page' />

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

export default EmployeeContract;


