import { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    MenuItem,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';
import MainCard from '@components/MainCard';
import MetaData from '@components/MetaData';
import Toolbar from '@components/ToolBar';
import { useGlobalContext } from '@providers/GlobalProvider';
import { getMediaUrl } from '@utils/mediaUrl';
import { loadListViewOptions, saveListViewOptions } from '@utils/listViewOptions';
import { getAllSimple as getDepartmentsSimple } from '@pages/Dashboard/Department/DepartmentServices';
import { getAllSimple as getUsersSimple } from '@pages/Dashboard/User/UserServices';
import {
    createAsset,
    createAssetAssignment,
    createAssetAudit,
    createAssetCategory,
    createAssetMaintenance,
    deleteAssetAssignments,
    deleteAssetAudits,
    deleteAssetCategories,
    deleteAssetMaintenances,
    deleteAssets,
    deleteMedia,
    exportAssetReport,
    exportAssets,
    getAllAssetCategories,
    getAllAssets,
    getAssetAssignments,
    getAssetAudits,
    getAssetCategories,
    getAssetMaintenances,
    getAssetReportOverview,
    getAssets,
    returnAssetAssignment,
    reorderAssetGallery,
    setPrimaryAssetImage,
    showAsset,
    updateAsset,
    updateAssetAssignment,
    updateAssetAudit,
    updateAssetCategory,
    updateAssetMaintenance,
} from './AssetManagementServices';

const TABS = {
    categories: 'Categories',
    assets: 'Assets',
    assignments: 'Assignments',
    maintenances: 'Maintenance',
    audits: 'Audits',
    reports: 'Reports',
};
const DEFAULT_ASSET_VIEW_OPTIONS = {
    assetTab: 'categories',
    assetKeyword: '',
    assetFilters: { category_id: '', department_id: '', location_status: '', condition_status: '', is_active: '' },
    assetSortModel: [],
};

const CONDITION_OPTIONS = ['new', 'good', 'fair', 'damaged', 'broken', 'lost', 'disposed'];
const LOCATION_OPTIONS = ['in_use', 'storage', 'broken', 'lost', 'maintenance', 'warranty', 'disposed'];
const AUDIT_RESULT_OPTIONS = ['matched', 'mismatch', 'missing', 'found'];
const STORAGE_KEY = 'list-view-options:asset-management';

const initialByTab = {
    categories: { parent_id: '', code: '', name: '', description: '', custom_field_schema: '[]', is_active: true },
    assets: { category_id: '', department_id: '', asset_code: '', qr_code: '', name: '', purchase_date: '', purchase_price: '', warranty_end_date: '', condition_status: 'good', location_status: 'storage', specifications: '{}', custom_field_values: '{}', image: null, images: [], is_active: true },
    assignments: { asset_id: '', user_id: '', department_id: '', assigned_at: '', due_back_at: '', handover_notes: '' },
    maintenances: { asset_id: '', title: '', type: 'maintenance', status: 'scheduled', scheduled_at: '', cost: '', notes: '' },
    audits: { department_id: '', audited_at: '', status: 'completed', notes: '', items: [] },
};

const parseJson = (value, fallback, label) => {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        throw new Error(`${label} must be valid JSON`);
    }
};

const toDate = (value) => (value ? new Date(value).toLocaleDateString() : '');
const toDateTime = (value) => (value ? new Date(value).toLocaleString() : '');
const toPrintableValue = (value) => (value === null || value === undefined || value === '' ? '-' : value);

const QrThumb = ({ value, size = 40 }) => {
    const [src, setSrc] = useState('');

    useEffect(() => {
        if (!value) {
            setSrc('');
            return;
        }

        if (typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://'))) {
            setSrc(value);
            return;
        }

        QRCode.toDataURL(String(value), {
            width: size * 2,
            margin: 1,
        })
            .then(setSrc)
            .catch(() => setSrc(''));
    }, [size, value]);

    if (!src) {
        return 'N/A';
    }

    return <Box component='img' alt='QR' src={src} sx={{ width: size, height: size, border: '1px solid', borderColor: 'divider', borderRadius: 1 }} />;
};

const getQrValue = (asset) => asset?.qr_code || asset?.asset_code || '';

const AssetThumb = ({ src, size = 36 }) => {
    const resolvedSrc = getMediaUrl(src);

    if (!src) {
        return (
            <Box
                sx={{
                    width: size,
                    height: size,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    fontSize: 11,
                }}
            >
                N/A
            </Box>
        );
    }

    return <Box component='img' alt='Asset' src={resolvedSrc} sx={{ width: size, height: size, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, objectFit: 'cover', display: 'block', bgcolor: 'background.paper' }} />;
};

const createAuditItemFromAsset = (asset, existingItem = null) => ({
    asset_id: asset.id,
    expected_location_status: existingItem?.expected_location_status || asset.location_status || 'storage',
    actual_location_status: existingItem?.actual_location_status || asset.location_status || 'storage',
    result_status: existingItem?.result_status || 'matched',
    notes: existingItem?.notes || '',
    included: existingItem?.included ?? true,
});

const syncAuditItemsWithAssets = (assets, currentItems = []) => {
    const itemMap = new Map((currentItems || []).map((item) => [Number(item.asset_id), item]));
    return assets.map((asset) => createAuditItemFromAsset(asset, itemMap.get(Number(asset.id))));
};

const escapeCsvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsvFile = (filename, headers, rows) => {
    const csv = [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

const getConditionChipColor = (value) => ({
    new: 'success',
    good: 'success',
    fair: 'warning',
    damaged: 'error',
    broken: 'error',
    lost: 'error',
    disposed: 'default',
}[value] || 'default');

const getLocationChipColor = (value) => ({
    in_use: 'success',
    storage: 'info',
    broken: 'error',
    lost: 'error',
    maintenance: 'warning',
    warranty: 'secondary',
    disposed: 'default',
}[value] || 'default');

const getAssignmentChipColor = (value) => ({
    assigned: 'success',
    returned: 'default',
    overdue: 'error',
}[value] || 'default');

const getMaintenanceChipColor = (value) => ({
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'default',
}[value] || 'default');

const getAuditChipColor = (value) => ({
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
}[value] || 'default');

const actionButtonSx = {
    textTransform: 'none',
    minWidth: { xs: '100%', sm: 'auto' },
};

const formSectionSx = {
    p: 2,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2.5,
    bgcolor: 'background.paper',
    height: '100%',
};

export default function AssetManagement() {
    const { showLoading, hideLoading, showNotification, showConfirm, closeConfirm } = useGlobalContext();
    const savedViewOptions = useMemo(
        () => loadListViewOptions(STORAGE_KEY, DEFAULT_ASSET_VIEW_OPTIONS),
        []
    );
    const [tab, setTab] = useState(savedViewOptions.assetTab || 'categories');
    const [rows, setRows] = useState({ categories: [], assets: [], assignments: [], maintenances: [], audits: [] });
    const [totals, setTotals] = useState({ categories: 0, assets: 0, assignments: 0, maintenances: 0, audits: 0 });
    const [selectedRows, setSelectedRows] = useState([]);
    const [keyword, setKeyword] = useState(savedViewOptions.assetKeyword || '');
    const [assetFilters, setAssetFilters] = useState(savedViewOptions.assetFilters);
    const [assetSortModel, setAssetSortModel] = useState(savedViewOptions.assetSortModel);
    const [maintenanceFilters, setMaintenanceFilters] = useState({ status: '', type: '' });
    const [auditFilters, setAuditFilters] = useState({ status: '', mismatch_only: '' });
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(initialByTab.categories);
    const [editingRecord, setEditingRecord] = useState(null);
    const [options, setOptions] = useState({ categories: [], assets: [], departments: [], users: [] });
    const [report, setReport] = useState({ summary: {}, by_department: [], by_location_status: [], warranty_expiring: [], damaged_or_lost: [], disposed_assets: [] });
    const [qrPreview, setQrPreview] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailAsset, setDetailAsset] = useState(null);
    const [draggedImageId, setDraggedImageId] = useState(null);
    const [imagePreview, setImagePreview] = useState({ open: false, src: '', title: '' });

    const loadOptions = async () => {
        const [categoryRes, assetRes, deptRes, userRes] = await Promise.all([
            getAllAssetCategories(),
            getAllAssets(),
            getDepartmentsSimple(),
            getUsersSimple(),
        ]);

        setOptions({
            categories: categoryRes.data.data || [],
            assets: assetRes.data.data || [],
            departments: deptRes.data.data || [],
            users: userRes.data.data || [],
        });
    };

    const loadTab = async (currentTab = tab, currentKeyword = keyword, overrides = {}) => {
        if (currentTab === 'reports') {
            const reportRes = await getAssetReportOverview();
            setReport(reportRes.data.data || reportRes.data);
            return;
        }

        const map = {
            categories: getAssetCategories,
            assets: getAssets,
            assignments: getAssetAssignments,
            maintenances: getAssetMaintenances,
            audits: getAssetAudits,
        };

        const res = await map[currentTab]({
            keyword: currentKeyword,
            per_page: 100,
            ...(currentTab === 'assets' ? (overrides.assetFilters || assetFilters) : {}),
            ...(currentTab === 'maintenances' ? (overrides.maintenanceFilters || maintenanceFilters) : {}),
            ...(currentTab === 'audits' ? (overrides.auditFilters || auditFilters) : {}),
            ...(currentTab === 'assets' && (overrides.assetSortModel || assetSortModel)[0]
                ? {
                    sort_field: (overrides.assetSortModel || assetSortModel)[0].field,
                    sort_direction: (overrides.assetSortModel || assetSortModel)[0].sort,
                }
                : {}),
        });
        setRows((prev) => ({ ...prev, [currentTab]: res.data.data || [] }));
        setTotals((prev) => ({ ...prev, [currentTab]: res.data.meta?.total || (res.data.data || []).length }));
    };

    useEffect(() => {
        showLoading();
        Promise.all([loadOptions(), loadTab('categories')])
            .catch((err) => showNotification(err.response?.data?.message || 'Failed to load assets', 'error'))
            .finally(hideLoading);
    }, []);

    useEffect(() => {
        showLoading();
        loadTab(tab)
            .then(() => setSelectedRows([]))
            .catch((err) => showNotification(err.response?.data?.message || 'Failed to load data', 'error'))
            .finally(hideLoading);
    }, [tab, assetFilters, assetSortModel, maintenanceFilters, auditFilters]);

    useEffect(() => {
        saveListViewOptions(STORAGE_KEY, {
            assetTab: tab,
            assetKeyword: keyword,
            assetFilters,
            assetSortModel,
        });
    }, [tab, keyword, assetFilters, assetSortModel]);

    const selectedCategory = useMemo(
        () => options.categories.find((item) => Number(item.id) === Number(form.category_id)),
        [options.categories, form.category_id]
    );

    const selectedAssetCategoryOption = useMemo(
        () => options.categories.find((item) => Number(item.id) === Number(form.category_id)) || null,
        [options.categories, form.category_id]
    );

    const selectedDepartmentOption = useMemo(
        () => options.departments.find((item) => Number(item.id) === Number(form.department_id)) || null,
        [options.departments, form.department_id]
    );

    const selectedAssignmentAssetOption = useMemo(
        () => options.assets.find((item) => Number(item.id) === Number(form.asset_id)) || null,
        [options.assets, form.asset_id]
    );

    const selectedAssignmentUserOption = useMemo(
        () => options.users.find((item) => Number(item.id) === Number(form.user_id)) || null,
        [options.users, form.user_id]
    );

    const selectedAssignmentDepartmentOption = useMemo(
        () => options.departments.find((item) => Number(item.id) === Number(form.department_id)) || null,
        [options.departments, form.department_id]
    );

    const selectedMaintenanceAssetOption = useMemo(
        () => options.assets.find((item) => Number(item.id) === Number(form.asset_id)) || null,
        [options.assets, form.asset_id]
    );

    const selectedAuditDepartmentOption = useMemo(
        () => options.departments.find((item) => Number(item.id) === Number(form.department_id)) || null,
        [options.departments, form.department_id]
    );

    const categoryCustomFields = useMemo(() => {
        if (!selectedCategory?.custom_field_schema || !Array.isArray(selectedCategory.custom_field_schema)) {
            return [];
        }

        return selectedCategory.custom_field_schema;
    }, [selectedCategory]);

    const auditScopedAssets = useMemo(() => {
        if (tab !== 'audits') {
            return [];
        }

        return (options.assets || []).filter((asset) => !form.department_id || Number(asset.department_id) === Number(form.department_id));
    }, [form.department_id, options.assets, tab]);

    const assetSummary = useMemo(() => {
        const assetRows = rows.assets || [];

        return {
            total: totals.assets || assetRows.length,
            active: assetRows.filter((item) => !!item.is_active).length,
            inUse: assetRows.filter((item) => item.location_status === 'in_use').length,
            storage: assetRows.filter((item) => item.location_status === 'storage').length,
            warrantySoon: assetRows.filter((item) => {
                if (!item.warranty_end_date) return false;
                const expiry = new Date(item.warranty_end_date);
                const today = new Date();
                const in30Days = new Date();
                in30Days.setDate(today.getDate() + 30);
                return expiry >= today && expiry <= in30Days;
            }).length,
        };
    }, [rows.assets, totals.assets]);

    const maintenanceSummary = useMemo(() => {
        const maintenanceRows = rows.maintenances || [];

        return {
            total: totals.maintenances || maintenanceRows.length,
            scheduled: maintenanceRows.filter((item) => item.status === 'scheduled').length,
            inProgress: maintenanceRows.filter((item) => item.status === 'in_progress').length,
            completed: maintenanceRows.filter((item) => item.status === 'completed').length,
            repair: maintenanceRows.filter((item) => item.type === 'repair').length,
        };
    }, [rows.maintenances, totals.maintenances]);

    const auditSummary = useMemo(() => {
        const auditRows = rows.audits || [];

        return {
            total: totals.audits || auditRows.length,
            planned: auditRows.filter((item) => item.status === 'planned').length,
            inProgress: auditRows.filter((item) => item.status === 'in_progress').length,
            completed: auditRows.filter((item) => item.status === 'completed').length,
            mismatch: auditRows.reduce((sum, item) => sum + Number(item.summary?.mismatch || 0), 0),
        };
    }, [rows.audits, totals.audits]);

    useEffect(() => {
        if (tab !== 'assets') {
            setQrPreview('');
            return;
        }

        const qrValue = form.qr_code || form.asset_code;
        if (!qrValue) {
            setQrPreview('');
            return;
        }

        QRCode.toDataURL(qrValue, {
            width: 160,
            margin: 1,
        })
            .then(setQrPreview)
            .catch(() => setQrPreview(''));
    }, [tab, form.asset_code, form.qr_code]);

    const columns = useMemo(() => ({
        categories: [
            { field: 'code', headerName: 'Code', width: 130 },
            { field: 'name', headerName: 'Name', width: 220 },
            { field: 'parent', headerName: 'Parent', width: 180, valueGetter: (_, row) => row.parent?.name || '' },
            { field: 'is_active', headerName: 'Status', width: 120, renderCell: (params) => <Chip size='small' label={params.value ? 'Active' : 'Inactive'} color={params.value ? 'success' : 'default'} variant='outlined' /> },
        ],
        assets: [
            {
                field: 'primary_image',
                headerName: 'Image',
                width: 120,
                sortable: false,
                renderCell: (params) => (
                    <Stack alignItems='center' spacing={0.5} sx={{ py: 0.5 }}>
                        <Tooltip
                            placement='right'
                            arrow
                            title={params.row.image_url ? <Box component='img' src={getMediaUrl(params.row.image_url)} alt='Asset Preview' sx={{ width: 220, height: 220, objectFit: 'cover', borderRadius: 1 }} /> : 'No image'}
                        >
                            <Box onClick={() => params.row.image_url && setImagePreview({ open: true, src: getMediaUrl(params.row.image_url), title: params.row.name || 'Asset image' })} sx={{ cursor: params.row.image_url ? 'zoom-in' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 40 }}>
                                <AssetThumb src={params.row.image_thumb_url || params.row.image_url} />
                            </Box>
                        </Tooltip>
                    </Stack>
                ),
            },
            { field: 'qr_preview', headerName: 'QR', width: 90, sortable: false, renderCell: (params) => <QrThumb value={getQrValue(params.row)} /> },
            { field: 'asset_code', headerName: 'Asset Code', width: 140 },
            { field: 'qr_code', headerName: 'QR Code', width: 140 },
            { field: 'name', headerName: 'Name', width: 220 },
            { field: 'category', headerName: 'Category', width: 180, valueGetter: (_, row) => row.category?.name || '' },
            { field: 'department', headerName: 'Department', width: 180, valueGetter: (_, row) => row.department?.name || '' },
            { field: 'current_user', headerName: 'Current User', width: 180, valueGetter: (_, row) => row.current_user?.name || '' },
            {
                field: 'location_status',
                headerName: 'Location',
                width: 130,
                renderCell: (params) => <Chip size='small' label={params.value || '-'} color={getLocationChipColor(params.value)} variant='outlined' />,
            },
            {
                field: 'condition_status',
                headerName: 'Condition',
                width: 130,
                renderCell: (params) => <Chip size='small' label={params.value || '-'} color={getConditionChipColor(params.value)} variant='outlined' />,
            },
            { field: 'purchase_date', headerName: 'Purchase Date', width: 130, valueGetter: (_, row) => toDate(row.purchase_date) },
            { field: 'warranty_end_date', headerName: 'Warranty End', width: 130, valueGetter: (_, row) => toDate(row.warranty_end_date) },
            {
                field: 'actions',
                headerName: 'Actions',
                width: 220,
                sortable: false,
                renderCell: (params) => (
                    <Stack direction='row' spacing={0.5}>
                        <Button size='small' onClick={() => handleViewAsset(params.row.id)}>View</Button>
                        <Button size='small' onClick={() => handleDownloadQr(params.row)}>QR</Button>
                        <Button size='small' onClick={() => handlePrintQr([params.row])}>Print</Button>
                    </Stack>
                ),
            },
        ],
        assignments: [
            { field: 'asset', headerName: 'Asset', width: 240, valueGetter: (_, row) => row.asset ? `${row.asset.asset_code} - ${row.asset.name}` : '' },
            { field: 'user', headerName: 'Assigned To', width: 180, valueGetter: (_, row) => row.user?.name || '' },
            { field: 'department', headerName: 'Department', width: 180, valueGetter: (_, row) => row.department?.name || '' },
            { field: 'assigned_at', headerName: 'Assigned At', width: 180, valueGetter: (_, row) => toDateTime(row.assigned_at) },
            { field: 'status', headerName: 'Status', width: 130, renderCell: (params) => <Chip size='small' label={params.value || '-'} color={getAssignmentChipColor(params.value)} variant='outlined' /> },
            { field: 'actions', headerName: 'Actions', width: 120, sortable: false, renderCell: (params) => params.row.status === 'assigned' ? <Button size='small' onClick={() => handleReturn(params.row.id)}>Return</Button> : null },
        ],
        maintenances: [
            { field: 'asset', headerName: 'Asset', width: 240, valueGetter: (_, row) => row.asset ? `${row.asset.asset_code} - ${row.asset.name}` : '' },
            { field: 'title', headerName: 'Title', width: 220 },
            { field: 'type', headerName: 'Type', width: 120, renderCell: (params) => <Chip size='small' label={params.value || '-'} color={params.value === 'repair' ? 'error' : params.value === 'warranty' ? 'secondary' : 'info'} variant='outlined' /> },
            { field: 'status', headerName: 'Status', width: 130, renderCell: (params) => <Chip size='small' label={params.value || '-'} color={getMaintenanceChipColor(params.value)} variant='outlined' /> },
            { field: 'scheduled_at', headerName: 'Scheduled', width: 180, valueGetter: (_, row) => toDateTime(row.scheduled_at) },
            { field: 'cost', headerName: 'Cost', width: 140 },
        ],
        audits: [
            { field: 'audited_at', headerName: 'Audited At', width: 180, valueGetter: (_, row) => toDateTime(row.audited_at) },
            { field: 'department', headerName: 'Department', width: 180, valueGetter: (_, row) => row.department?.name || '' },
            { field: 'status', headerName: 'Status', width: 130, renderCell: (params) => <Chip size='small' label={params.value || '-'} color={getAuditChipColor(params.value)} variant='outlined' /> },
            { field: 'total', headerName: 'Items', width: 100, valueGetter: (_, row) => row.summary?.total || 0 },
            { field: 'mismatch', headerName: 'Mismatch', width: 110, valueGetter: (_, row) => row.summary?.mismatch || 0 },
        ],
    }), []);

    const openCreate = () => {
        setEditingRecord(null);
        if (tab === 'audits') {
            setForm({
                ...initialByTab.audits,
                items: syncAuditItemsWithAssets(options.assets || [], []),
            });
        } else {
            setForm(initialByTab[tab]);
        }
        setOpen(true);
    };

    const openEdit = (row) => {
        setEditingRecord(row);

        if (tab === 'categories') {
            setForm({
                parent_id: row.parent_id || '',
                code: row.code || '',
                name: row.name || '',
                description: row.description || '',
                custom_field_schema: JSON.stringify(row.custom_field_schema || [], null, 2),
                is_active: !!row.is_active,
            });
        }

        if (tab === 'assets') {
            setForm({
                category_id: row.category_id || '',
                department_id: row.department_id || '',
                asset_code: row.asset_code || '',
                qr_code: row.qr_code || '',
                name: row.name || '',
                purchase_date: row.purchase_date || '',
                purchase_price: row.purchase_price || '',
                warranty_end_date: row.warranty_end_date || '',
                condition_status: row.condition_status || 'good',
                location_status: row.location_status || 'storage',
                specifications: JSON.stringify(row.specifications || {}, null, 2),
                custom_field_values: JSON.stringify(row.custom_field_values || {}, null, 2),
                image: null,
                images: [],
                is_active: !!row.is_active,
            });
        }

        if (tab === 'assignments') {
            setForm({
                asset_id: row.asset_id || '',
                user_id: row.user_id || '',
                department_id: row.department_id || '',
                assigned_at: row.assigned_at ? String(row.assigned_at).slice(0, 16) : '',
                due_back_at: row.due_back_at ? String(row.due_back_at).slice(0, 16) : '',
                handover_notes: row.handover_notes || '',
            });
        }

        if (tab === 'maintenances') {
            setForm({
                asset_id: row.asset_id || '',
                title: row.title || '',
                type: row.type || 'maintenance',
                status: row.status || 'scheduled',
                scheduled_at: row.scheduled_at ? String(row.scheduled_at).slice(0, 16) : '',
                cost: row.cost || '',
                notes: row.notes || '',
            });
        }

        if (tab === 'audits') {
            const items = Array.isArray(row.items) ? row.items.map((item) => ({
                asset_id: item.asset_id,
                expected_location_status: item.expected_location_status,
                actual_location_status: item.actual_location_status,
                result_status: item.result_status,
                notes: item.notes,
                included: true,
            })) : [];
            setForm({
                department_id: row.department_id || '',
                audited_at: row.audited_at ? String(row.audited_at).slice(0, 16) : '',
                status: row.status || 'completed',
                notes: row.notes || '',
                items: syncAuditItemsWithAssets(
                    (options.assets || []).filter((asset) => !row.department_id || Number(asset.department_id) === Number(row.department_id)),
                    items
                ),
            });
        }

        setOpen(true);
    };

    const handleSearch = async () => {
        showLoading();
        await loadTab(tab, keyword).catch((err) => showNotification(err.response?.data?.message || 'Search failed', 'error'));
        hideLoading();
    };

    const handleAssetFilterChange = (field, value) => {
        setAssetFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleAssetSummaryFilter = (type) => {
        if (type === 'total') {
            setAssetFilters((prev) => ({ ...prev, location_status: '', is_active: '' }));
            return;
        }

        if (type === 'active') {
            setAssetFilters((prev) => ({ ...prev, is_active: prev.is_active === '1' ? '' : '1' }));
            return;
        }

        if (type === 'in_use') {
            setAssetFilters((prev) => ({ ...prev, location_status: prev.location_status === 'in_use' ? '' : 'in_use' }));
            return;
        }

        if (type === 'storage') {
            setAssetFilters((prev) => ({ ...prev, location_status: prev.location_status === 'storage' ? '' : 'storage' }));
        }
    };

    const handleMaintenanceSummaryFilter = (type) => {
        if (type === 'total') {
            setMaintenanceFilters({ status: '', type: '' });
            return;
        }

        if (type === 'repair') {
            setMaintenanceFilters((prev) => ({ ...prev, type: prev.type === 'repair' ? '' : 'repair', status: '' }));
            return;
        }

        setMaintenanceFilters((prev) => ({ ...prev, status: prev.status === type ? '' : type, type: '' }));
    };

    const handleAuditSummaryFilter = (type) => {
        if (type === 'total') {
            setAuditFilters({ status: '', mismatch_only: '' });
            return;
        }

        if (type === 'mismatch') {
            setAuditFilters((prev) => ({ ...prev, mismatch_only: prev.mismatch_only === '1' ? '' : '1', status: '' }));
            return;
        }

        setAuditFilters((prev) => ({ ...prev, status: prev.status === type ? '' : type, mismatch_only: '' }));
    };

    const handleAssetSortChange = (model) => {
        const nextSort = Array.isArray(model) ? model.filter((item) => ['purchase_date', 'warranty_end_date'].includes(item.field)).slice(0, 1) : [];
        setAssetSortModel(nextSort);
    };

    const handleReturn = async (id) => {
        showLoading();
        try {
            await returnAssetAssignment(id, {});
            showNotification('Returned successfully', 'success');
            await Promise.all([loadTab('assignments'), loadTab('assets'), loadOptions()]);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Return failed', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleViewAsset = async (id) => {
        showLoading();
        try {
            const res = await showAsset(id);
            setDetailAsset(res.data.data || res.data);
            setDetailOpen(true);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load asset detail', 'error');
        } finally {
            hideLoading();
        }
    };

    const refreshDetailAsset = async (assetId) => {
        const res = await showAsset(assetId);
        setDetailAsset(res.data.data || res.data);
    };

    const handleDownloadQr = async (asset) => {
        const qrValue = getQrValue(asset);
        if (!qrValue) {
            showNotification('No QR image available', 'error');
            return;
        }

        const src = await QRCode.toDataURL(qrValue, { width: 640, margin: 1 });
        const link = document.createElement('a');
        link.href = src;
        link.download = `${asset.asset_code || asset.qr_code || 'asset-qr'}.png`;
        link.click();
    };

    const handlePrintQr = async (assetsToPrint) => {
        const printableAssets = await Promise.all(
            assetsToPrint
                .filter((asset) => getQrValue(asset))
                .map(async (asset) => ({
                    ...asset,
                    generated_qr_image: await QRCode.toDataURL(getQrValue(asset), { width: 640, margin: 1 }),
                }))
        );

        if (printableAssets.length === 0) {
            showNotification('No QR image available to print', 'error');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            showNotification('Popup was blocked', 'error');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Asset QR Labels</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; }
                        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                        .item { border: 1px solid #ddd; border-radius: 8px; padding: 16px; text-align: center; }
                        img { width: 180px; height: 180px; object-fit: contain; }
                        .code { font-weight: 600; margin-top: 8px; }
                        .name { font-size: 12px; color: #555; margin-top: 4px; }
                    </style>
                </head>
                <body>
                    <div class="grid">
                        ${printableAssets.map((asset) => `
                            <div class="item">
                                <img src="${asset.generated_qr_image}" alt="QR" />
                                <div class="code">${asset.asset_code || asset.qr_code || ''}</div>
                                <div class="name">${asset.name || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                    <script>window.onload = () => window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDeleteGalleryImage = (mediaId) => {
        showConfirm(
            'Delete image',
            'Remove this image from the asset gallery?',
            async () => {
                showLoading();
                try {
                    await deleteMedia(mediaId);
                    const assetId = detailAsset?.id;
                    if (assetId) {
                        await refreshDetailAsset(assetId);
                    }
                    await Promise.all([loadTab('assets'), loadOptions()]);
                    closeConfirm();
                    showNotification('Image deleted successfully', 'success');
                } catch (err) {
                    showNotification(err.response?.data?.message || 'Failed to delete image', 'error');
                } finally {
                    hideLoading();
                }
            },
            closeConfirm
        );
    };

    const handleSetPrimaryImage = async (mediaId) => {
        if (!detailAsset?.id) return;

        showLoading();
        try {
            await setPrimaryAssetImage(detailAsset.id, mediaId);
            await Promise.all([refreshDetailAsset(detailAsset.id), loadTab('assets')]);
            showNotification('Primary image updated', 'success');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to update primary image', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleGalleryReorder = async (fromMediaId, toMediaId) => {
        if (!detailAsset?.id || !fromMediaId || !toMediaId || fromMediaId === toMediaId) {
            return;
        }

        const images = [...(detailAsset.gallery_images || [])];
        const fromIndex = images.findIndex((image) => Number(image.id) === Number(fromMediaId));
        const toIndex = images.findIndex((image) => Number(image.id) === Number(toMediaId));

        if (fromIndex === -1 || toIndex === -1) {
            return;
        }

        const [movedImage] = images.splice(fromIndex, 1);
        images.splice(toIndex, 0, movedImage);

        showLoading();
        try {
            await reorderAssetGallery(detailAsset.id, images.map((image) => image.id));
            await Promise.all([refreshDetailAsset(detailAsset.id), loadTab('assets')]);
            showNotification('Gallery order updated', 'success');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to reorder gallery', 'error');
        } finally {
            setDraggedImageId(null);
            hideLoading();
        }
    };

    const handleExportReportExcel = async () => {
        try {
            showLoading();
            const response = await exportAssetReport();
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            saveAs(blob, `asset_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            showNotification('Exported Excel successfully', 'success');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Export failed', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleAuditDepartmentChange = (departmentId) => {
        setForm((prev) => {
            const scopedAssets = (options.assets || []).filter((asset) => !departmentId || Number(asset.department_id) === Number(departmentId));
            return {
                ...prev,
                department_id: departmentId,
                items: syncAuditItemsWithAssets(scopedAssets, prev.items || []),
            };
        });
    };

    const handleAuditItemChange = (assetId, field, value) => {
        setForm((prev) => ({
            ...prev,
            items: (prev.items || []).map((item) => {
                if (Number(item.asset_id) !== Number(assetId)) {
                    return item;
                }

                const nextItem = { ...item, [field]: value };
                if (field === 'actual_location_status' && item.result_status === 'matched') {
                    nextItem.result_status = value === item.expected_location_status ? 'matched' : 'mismatch';
                }
                return nextItem;
            }),
        }));
    };

    const handleExportAssetsCsv = () => {
        const assetRows = (rows.assets || []).map((asset) => [
            asset.asset_code,
            asset.qr_code,
            asset.name,
            asset.category?.name || '',
            asset.department?.name || '',
            asset.current_user?.name || '',
            asset.location_status,
            asset.condition_status,
            toDate(asset.purchase_date),
            toDate(asset.warranty_end_date),
        ]);

        downloadCsvFile(
            'asset-list.csv',
            ['Asset Code', 'QR Code', 'Name', 'Category', 'Department', 'Current User', 'Location', 'Condition', 'Purchase Date', 'Warranty End'],
            assetRows
        );
    };

    const handleExportAssetsExcel = async () => {
        try {
            showLoading();
            const response = await exportAssets({
                keyword,
                ...assetFilters,
                ...(assetSortModel[0] ? { sort_field: assetSortModel[0].field, sort_direction: assetSortModel[0].sort } : {}),
            });
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            saveAs(blob, `assets_${new Date().toISOString().split('T')[0]}.xlsx`);
            showNotification('Exported Excel successfully', 'success');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Export failed', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleExportReportCsv = () => {
        const rowsToExport = [];

        rowsToExport.push(['Summary', 'Value']);
        rowsToExport.push(['Total Assets', report.summary?.total_assets || 0]);
        rowsToExport.push(['In Use', report.summary?.in_use_assets || 0]);
        rowsToExport.push(['In Storage', report.summary?.storage_assets || 0]);
        rowsToExport.push(['Warranty Expiring', report.summary?.warranty_expiring_count || 0]);
        rowsToExport.push(['Damaged / Lost', report.summary?.damaged_or_lost_count || 0]);
        rowsToExport.push(['Disposed', report.summary?.disposed_count || 0]);
        rowsToExport.push([]);
        rowsToExport.push(['Assets By Department', 'Count']);
        (report.by_department || []).forEach((item) => rowsToExport.push([item.label, item.count]));
        rowsToExport.push([]);
        rowsToExport.push(['Assets By Status', 'Count']);
        (report.by_location_status || []).forEach((item) => rowsToExport.push([item.label, item.count]));
        rowsToExport.push([]);
        rowsToExport.push(['Warranty Expiring', 'Asset Code', 'Name', 'Department', 'Warranty End']);
        (report.warranty_expiring || []).forEach((asset) => rowsToExport.push(['Warranty Expiring', asset.asset_code, asset.name, asset.department?.name || '', toDate(asset.warranty_end_date)]));
        rowsToExport.push([]);
        rowsToExport.push(['Damaged / Lost', 'Asset Code', 'Name', 'Condition', 'Department']);
        (report.damaged_or_lost || []).forEach((asset) => rowsToExport.push(['Damaged / Lost', asset.asset_code, asset.name, asset.condition_status, asset.department?.name || '']));
        rowsToExport.push([]);
        rowsToExport.push(['Disposed', 'Asset Code', 'Name', 'Department']);
        (report.disposed_assets || []).forEach((asset) => rowsToExport.push(['Disposed', asset.asset_code, asset.name, asset.department?.name || '']));

        downloadCsvFile('asset-report-overview.csv', ['Section', 'Col1', 'Col2', 'Col3', 'Col4'], rowsToExport);
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            showNotification('Popup was blocked', 'error');
            return;
        }

        const renderList = (title, items, columns) => `
            <div class="section">
                <h3>${title}</h3>
                <table>
                    <thead>
                        <tr>${columns.map((column) => `<th>${column.label}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${items.length > 0 ? items.map((item) => `<tr>${columns.map((column) => `<td>${toPrintableValue(column.render(item))}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${columns.length}">No data</td></tr>`}
                    </tbody>
                </table>
            </div>
        `;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Asset Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
                        h1, h3 { margin: 0 0 12px; }
                        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
                        .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
                        .label { font-size: 12px; color: #666; }
                        .value { font-size: 20px; font-weight: 700; margin-top: 8px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
                        .section { margin-top: 24px; }
                    </style>
                </head>
                <body>
                    <h1>Asset Report</h1>
                    <div class="summary">
                        ${[
                            ['Total Assets', report.summary?.total_assets || 0],
                            ['In Use', report.summary?.in_use_assets || 0],
                            ['In Storage', report.summary?.storage_assets || 0],
                            ['Warranty Expiring', report.summary?.warranty_expiring_count || 0],
                            ['Damaged / Lost', report.summary?.damaged_or_lost_count || 0],
                            ['Disposed', report.summary?.disposed_count || 0],
                        ].map(([label, value]) => `<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('')}
                    </div>
                    ${renderList('Assets By Department', report.by_department || [], [
                        { label: 'Department', render: (item) => item.label },
                        { label: 'Count', render: (item) => item.count },
                    ])}
                    ${renderList('Assets By Status', report.by_location_status || [], [
                        { label: 'Status', render: (item) => item.label },
                        { label: 'Count', render: (item) => item.count },
                    ])}
                    ${renderList('Warranty Expiring', report.warranty_expiring || [], [
                        { label: 'Asset Code', render: (item) => item.asset_code },
                        { label: 'Name', render: (item) => item.name },
                        { label: 'Department', render: (item) => item.department?.name || '' },
                        { label: 'Warranty End', render: (item) => toDate(item.warranty_end_date) },
                    ])}
                    ${renderList('Damaged / Lost', report.damaged_or_lost || [], [
                        { label: 'Asset Code', render: (item) => item.asset_code },
                        { label: 'Name', render: (item) => item.name },
                        { label: 'Condition', render: (item) => item.condition_status },
                        { label: 'Department', render: (item) => item.department?.name || '' },
                    ])}
                    ${renderList('Disposed Assets', report.disposed_assets || [], [
                        { label: 'Asset Code', render: (item) => item.asset_code },
                        { label: 'Name', render: (item) => item.name },
                        { label: 'Department', render: (item) => item.department?.name || '' },
                    ])}
                    <script>window.onload = () => window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDelete = () => {
        const actionMap = {
            categories: deleteAssetCategories,
            assets: deleteAssets,
            assignments: deleteAssetAssignments,
            maintenances: deleteAssetMaintenances,
            audits: deleteAssetAudits,
        };

        showConfirm(
            'Confirm deletion',
            `Delete ${selectedRows.length} record(s)?`,
            async () => {
                showLoading();
                try {
                    await actionMap[tab](selectedRows);
                    showNotification('Deleted successfully', 'success');
                    closeConfirm();
                    await Promise.all([loadTab(tab), loadOptions()]);
                } catch (err) {
                    showNotification(err.response?.data?.message || 'Delete failed', 'error');
                } finally {
                    hideLoading();
                }
            },
            closeConfirm
        );
    };

    const handleSubmit = async () => {
        showLoading();
        try {
            if (tab === 'categories') {
                const payload = {
                    parent_id: form.parent_id || null,
                    code: form.code,
                    name: form.name,
                    description: form.description || null,
                    custom_field_schema: parseJson(form.custom_field_schema, [], 'Custom field schema'),
                    is_active: !!form.is_active,
                };
                if (editingRecord) {
                    await updateAssetCategory(editingRecord.id, payload);
                } else {
                    await createAssetCategory(payload);
                }
            }

            if (tab === 'assets') {
                const specs = parseJson(form.specifications, {}, 'Specifications');
                const custom = parseJson(form.custom_field_values, {}, 'Custom field values');
                if (form.image) {
                    const fd = new FormData();
                    [['category_id', form.category_id], ['department_id', form.department_id], ['asset_code', form.asset_code], ['qr_code', form.qr_code || form.asset_code], ['name', form.name], ['purchase_date', form.purchase_date], ['purchase_price', form.purchase_price], ['warranty_end_date', form.warranty_end_date], ['condition_status', form.condition_status], ['location_status', form.location_status], ['is_active', form.is_active ? '1' : '0']].forEach(([key, value]) => {
                        if (value) fd.append(key, value);
                    });
                    Object.entries(specs).forEach(([key, value]) => fd.append(`specifications[${key}]`, value));
                    Object.entries(custom).forEach(([key, value]) => fd.append(`custom_field_values[${key}]`, value));
                    fd.append('image', form.image);
                    (form.images || []).forEach((image) => fd.append('images[]', image));
                    if (editingRecord) {
                        await updateAsset(editingRecord.id, fd);
                    } else {
                        await createAsset(fd);
                    }
                } else {
                    const payload = {
                        category_id: form.category_id || null,
                        department_id: form.department_id || null,
                        asset_code: form.asset_code,
                        qr_code: form.qr_code || form.asset_code,
                        name: form.name,
                        purchase_date: form.purchase_date || null,
                        purchase_price: form.purchase_price || null,
                        warranty_end_date: form.warranty_end_date || null,
                        condition_status: form.condition_status,
                        location_status: form.location_status,
                        specifications: specs,
                        custom_field_values: custom,
                        is_active: !!form.is_active,
                    };
                    if ((form.images || []).length > 0) {
                        const fd = new FormData();
                        Object.entries(payload).forEach(([key, value]) => {
                            if (value !== null && value !== undefined && value !== '') {
                                if (typeof value === 'object' && !Array.isArray(value)) {
                                    Object.entries(value).forEach(([subKey, subValue]) => fd.append(`${key}[${subKey}]`, subValue));
                                } else {
                                    fd.append(key, value);
                                }
                            }
                        });
                        (form.images || []).forEach((image) => fd.append('images[]', image));
                        if (editingRecord) {
                            await updateAsset(editingRecord.id, fd);
                        } else {
                            await createAsset(fd);
                        }
                    } else if (editingRecord) {
                        await updateAsset(editingRecord.id, payload);
                    } else {
                        await createAsset(payload);
                    }
                }
            }

            if (tab === 'assignments') {
                const payload = {
                    asset_id: Number(form.asset_id),
                    user_id: form.user_id ? Number(form.user_id) : null,
                    department_id: form.department_id ? Number(form.department_id) : null,
                    assigned_at: form.assigned_at,
                    due_back_at: form.due_back_at || null,
                    handover_notes: form.handover_notes || null,
                };
                if (editingRecord) {
                    await updateAssetAssignment(editingRecord.id, payload);
                } else {
                    await createAssetAssignment(payload);
                }
            }

            if (tab === 'maintenances') {
                const payload = {
                    asset_id: Number(form.asset_id),
                    title: form.title,
                    type: form.type,
                    status: form.status,
                    scheduled_at: form.scheduled_at || null,
                    cost: form.cost || null,
                    notes: form.notes || null,
                };
                if (editingRecord) {
                    await updateAssetMaintenance(editingRecord.id, payload);
                } else {
                    await createAssetMaintenance(payload);
                }
            }

            if (tab === 'audits') {
                const payload = {
                    department_id: form.department_id ? Number(form.department_id) : null,
                    audited_at: form.audited_at,
                    status: form.status,
                    notes: form.notes || null,
                    items: (form.items || [])
                        .filter((item) => item.included)
                        .map((item) => {
                            const payloadItem = { ...item };
                            delete payloadItem.included;

                            return {
                                ...payloadItem,
                                notes: payloadItem.notes || null,
                            };
                        }),
                };
                if (editingRecord) {
                    await updateAssetAudit(editingRecord.id, payload);
                } else {
                    await createAssetAudit(payload);
                }
            }

            const isCreatingAsset = tab === 'assets' && !editingRecord;
            const resetAssetFilters = { ...DEFAULT_ASSET_VIEW_OPTIONS.assetFilters };
            const resetAssetSortModel = [...DEFAULT_ASSET_VIEW_OPTIONS.assetSortModel];

            showNotification(
                isCreatingAsset
                    ? 'Đã tạo tài sản và làm mới danh sách hiển thị.'
                    : editingRecord
                        ? 'Updated successfully'
                        : 'Created successfully',
                'success'
            );
            setOpen(false);
            setEditingRecord(null);

            if (isCreatingAsset) {
                setKeyword(DEFAULT_ASSET_VIEW_OPTIONS.assetKeyword);
                setAssetFilters(resetAssetFilters);
                setAssetSortModel(resetAssetSortModel);
                await Promise.all([
                    loadTab('assets', DEFAULT_ASSET_VIEW_OPTIONS.assetKeyword, {
                        assetFilters: resetAssetFilters,
                        assetSortModel: resetAssetSortModel,
                    }),
                    loadOptions(),
                ]);
            } else {
                await Promise.all([loadTab(tab), loadOptions()]);
            }
        } catch (err) {
            showNotification(err.response?.data?.message || err.message || 'Save failed', 'error');
        } finally {
            hideLoading();
        }
    };

    const renderForm = () => {
        if (tab === 'categories') {
            return (
                <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={7}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Thông tin chính
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Khai báo mã, tên và danh mục cha để dễ tổ chức cây tài sản.
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            label='Mã danh mục'
                                            fullWidth
                                            size='small'
                                            placeholder='VD: LAPTOP'
                                            value={form.code}
                                            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={7}>
                                        <TextField
                                            label='Tên danh mục'
                                            fullWidth
                                            size='small'
                                            placeholder='Nhập tên hiển thị'
                                            value={form.name}
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            select
                                            label='Danh mục cha'
                                            fullWidth
                                            size='small'
                                            value={form.parent_id}
                                            onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
                                            helperText='Để trống nếu đây là danh mục cấp cao nhất.'
                                        >
                                            <MenuItem value=''>Không có</MenuItem>
                                            {options.categories.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Trạng thái
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Kiểm soát việc danh mục có được sử dụng trong các form tài sản hay không.
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        px: 1.5,
                                        py: 1.25,
                                        borderRadius: 2,
                                        border: '1px dashed',
                                        borderColor: form.is_active ? 'success.main' : 'divider',
                                        bgcolor: form.is_active ? 'success.lighter' : 'background.default',
                                    }}
                                >
                                    <FormControlLabel
                                        sx={{ alignItems: 'flex-start', m: 0 }}
                                        control={
                                            <Checkbox
                                                checked={!!form.is_active}
                                                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                    {form.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                                                </Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {form.is_active ? 'Danh mục sẽ xuất hiện trong các lựa chọn liên quan.' : 'Danh mục sẽ được ẩn khỏi các lựa chọn mới.'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Trường tuỳ biến
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Định nghĩa thêm các field riêng cho danh mục này dưới dạng mảng JSON.
                                    </Typography>
                                </Box>

                                <TextField
                                    label='Custom field schema (JSON array)'
                                    fullWidth
                                    size='small'
                                    multiline
                                    minRows={6}
                                    value={form.custom_field_schema}
                                    onChange={(e) => setForm((p) => ({ ...p, custom_field_schema: e.target.value }))}
                                    helperText='Ví dụ: [{"key":"cpu","label":"CPU","type":"text"}]'
                                />
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            );
        }

        if (tab === 'assets') {
            const customFieldValues = parseJson(form.custom_field_values || '{}', {}, 'Custom field values');

            return (
                <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={8}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Thông tin tài sản
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Nhập nhóm phân loại, mã nhận diện và thông tin mua sắm cơ bản.
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            size='small'
                                            options={options.categories}
                                            value={selectedAssetCategoryOption}
                                            onChange={(_, value) => setForm((p) => ({ ...p, category_id: value?.id || '' }))}
                                            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                                            getOptionLabel={(option) => option?.name || ''}
                                            renderOption={(props, option) => (
                                                <Box component='li' {...props}>
                                                    <Box>
                                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                            {option.name}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {[option.code, option.parent?.name ? `Cha: ${option.parent.name}` : null].filter(Boolean).join(' • ') || 'Danh mục gốc'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label='Danh mục'
                                                    placeholder='Tìm theo tên hoặc mã'
                                                    helperText={selectedAssetCategoryOption?.code ? `Mã: ${selectedAssetCategoryOption.code}` : 'Chọn danh mục tài sản phù hợp.'}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            size='small'
                                            options={options.departments}
                                            value={selectedDepartmentOption}
                                            onChange={(_, value) => setForm((p) => ({ ...p, department_id: value?.id || '' }))}
                                            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                                            getOptionLabel={(option) => option?.name || ''}
                                            renderOption={(props, option) => (
                                                <Box component='li' {...props}>
                                                    <Box>
                                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                            {option.name}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {[option.code, option.department_title?.name, option.organization?.name].filter(Boolean).join(' • ') || 'Phòng ban nội bộ'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label='Phòng ban'
                                                    placeholder='Tìm theo tên phòng ban'
                                                    helperText={selectedDepartmentOption ? `Đã chọn: ${selectedDepartmentOption.name}` : 'Có thể bỏ trống nếu tài sản chưa gán phòng ban.'}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField label='Mã tài sản' fullWidth size='small' placeholder='VD: TS-0001' value={form.asset_code} onChange={(e) => setForm((p) => ({ ...p, asset_code: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField label='Mã QR' fullWidth size='small' placeholder='Để trống sẽ dùng mã tài sản' value={form.qr_code} onChange={(e) => setForm((p) => ({ ...p, qr_code: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField label='Tên tài sản' fullWidth size='small' placeholder='Nhập tên hiển thị của tài sản' value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField type='date' label='Ngày mua' fullWidth size='small' InputLabelProps={{ shrink: true }} value={form.purchase_date} onChange={(e) => setForm((p) => ({ ...p, purchase_date: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField type='number' label='Giá mua' fullWidth size='small' value={form.purchase_price} onChange={(e) => setForm((p) => ({ ...p, purchase_price: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField type='date' label='Hết bảo hành' fullWidth size='small' InputLabelProps={{ shrink: true }} value={form.warranty_end_date} onChange={(e) => setForm((p) => ({ ...p, warranty_end_date: e.target.value }))} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField select label='Tình trạng' fullWidth size='small' value={form.condition_status} onChange={(e) => setForm((p) => ({ ...p, condition_status: e.target.value }))}>
                                            {CONDITION_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField select label='Vị trí sử dụng' fullWidth size='small' value={form.location_status} onChange={(e) => setForm((p) => ({ ...p, location_status: e.target.value }))}>
                                            {LOCATION_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Stack spacing={2.5} sx={{ height: '100%' }}>
                            <Box sx={{ ...formSectionSx, minHeight: 220 }}>
                                <Stack spacing={1.5} alignItems='center' textAlign='center'>
                                    <Box>
                                        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                            QR Preview
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            Mã QR được tạo tự động từ mã QR hoặc mã tài sản.
                                        </Typography>
                                    </Box>

                                    {qrPreview ? (
                                        <Box component='img' src={qrPreview} alt='QR Preview' sx={{ width: 168, height: 168, borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1, bgcolor: 'common.white' }} />
                                    ) : (
                                        <Box sx={{ width: 168, height: 168, borderRadius: 2, border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
                                            <Typography variant='body2' color='text.secondary'>
                                                Nhập mã tài sản hoặc mã QR để xem trước.
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>

                            <Box sx={formSectionSx}>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                            Hình ảnh
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            Tải ảnh đại diện và ảnh gallery cho tài sản.
                                        </Typography>
                                    </Box>

                                    <Button variant='outlined' component='label' sx={actionButtonSx}>
                                        Ảnh đại diện
                                        <input hidden type='file' accept='image/*' onChange={(e) => setForm((p) => ({ ...p, image: e.target.files?.[0] || null }))} />
                                    </Button>
                                    <Typography variant='body2' color='text.secondary'>
                                        {form.image ? form.image.name : 'Chưa chọn ảnh đại diện'}
                                    </Typography>

                                    <Button variant='outlined' component='label' sx={actionButtonSx}>
                                        Ảnh thư viện
                                        <input hidden multiple type='file' accept='image/*' onChange={(e) => setForm((p) => ({ ...p, images: Array.from(e.target.files || []) }))} />
                                    </Button>
                                    <Typography variant='body2' color='text.secondary'>
                                        {(form.images || []).length > 0 ? `${form.images.length} ảnh đã chọn` : 'Chưa chọn ảnh thư viện'}
                                    </Typography>
                                    {(form.images || []).length > 0 ? (
                                        <Box sx={{ px: 1.25, py: 1, borderRadius: 2, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
                                            <Typography variant='caption' color='text.secondary'>
                                                {(form.images || []).map((item) => item.name).join(', ')}
                                            </Typography>
                                        </Box>
                                    ) : null}
                                </Stack>
                            </Box>
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Thông số kỹ thuật
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Lưu các thuộc tính kỹ thuật dùng chung của tài sản dưới dạng JSON object.
                                    </Typography>
                                </Box>

                                <TextField label='Specifications (JSON object)' fullWidth size='small' multiline minRows={4} value={form.specifications} onChange={(e) => setForm((p) => ({ ...p, specifications: e.target.value }))} />
                            </Stack>
                        </Box>
                    </Grid>

                    {categoryCustomFields.length > 0 && (
                        <Grid item xs={12}>
                            <Box sx={formSectionSx}>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                            Trường theo danh mục
                                        </Typography>
                                        <Typography variant='body2' color='text.secondary'>
                                            Các field này thay đổi theo danh mục đã chọn.
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                    {categoryCustomFields.map((field) => {
                                        const fieldKey = field.key;
                                        const label = field.label || field.key;
                                        const type = field.type || 'text';
                                        const value = customFieldValues[fieldKey] ?? '';

                                        if (type === 'select' && Array.isArray(field.options)) {
                                            return (
                                                <Grid item xs={12} md={6} key={fieldKey}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size='small'
                                                        label={label}
                                                        value={value}
                                                        onChange={(e) => {
                                                            const next = { ...customFieldValues, [fieldKey]: e.target.value };
                                                            setForm((p) => ({ ...p, custom_field_values: JSON.stringify(next, null, 2) }));
                                                        }}
                                                    >
                                                        <MenuItem value=''>None</MenuItem>
                                                        {field.options.map((option) => (
                                                            <MenuItem key={String(option)} value={option}>{String(option)}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                            );
                                        }

                                        return (
                                            <Grid item xs={12} md={6} key={fieldKey}>
                                                <TextField
                                                    fullWidth
                                                    size='small'
                                                    type={type === 'number' ? 'number' : 'text'}
                                                    label={label}
                                                    value={value}
                                                    onChange={(e) => {
                                                        const next = { ...customFieldValues, [fieldKey]: e.target.value };
                                                        setForm((p) => ({ ...p, custom_field_values: JSON.stringify(next, null, 2) }));
                                                    }}
                                                />
                                            </Grid>
                                        );
                                    })}
                                    </Grid>
                                </Stack>
                            </Box>
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Giá trị tuỳ biến
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Có thể chỉnh trực tiếp JSON để bổ sung hoặc override dữ liệu field động.
                                    </Typography>
                                </Box>

                                <TextField label='Custom Field Values (JSON object)' fullWidth size='small' multiline minRows={4} value={form.custom_field_values} onChange={(e) => setForm((p) => ({ ...p, custom_field_values: e.target.value }))} />
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            );
        }

        if (tab === 'assignments') {
            return (
                <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={7}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Thông tin bàn giao
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Chọn tài sản cần bàn giao và xác định người hoặc phòng ban đang nhận.
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Autocomplete
                                            size='small'
                                            options={options.assets}
                                            value={selectedAssignmentAssetOption}
                                            onChange={(_, value) => setForm((p) => ({ ...p, asset_id: value?.id || '' }))}
                                            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                                            getOptionLabel={(option) => option ? `${option.asset_code} - ${option.name}` : ''}
                                            renderOption={(props, option) => (
                                                <Box component='li' {...props}>
                                                    <Box>
                                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                            {option.asset_code} - {option.name}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {[option.category?.name, option.department?.name, option.location_status].filter(Boolean).join(' • ') || 'Tài sản chưa phân loại'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label='Tài sản'
                                                    placeholder='Tìm theo mã hoặc tên tài sản'
                                                    helperText={selectedAssignmentAssetOption ? `Đang chọn: ${selectedAssignmentAssetOption.asset_code}` : 'Chọn tài sản cần bàn giao.'}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            size='small'
                                            options={options.users}
                                            value={selectedAssignmentUserOption}
                                            onChange={(_, value) => setForm((p) => ({ ...p, user_id: value?.id || '' }))}
                                            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                                            getOptionLabel={(option) => option?.name || ''}
                                            renderOption={(props, option) => (
                                                <Box component='li' {...props}>
                                                    <Box>
                                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                            {option.name}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {[option.email, option.detail?.employee_code].filter(Boolean).join(' • ') || 'Nhân sự nội bộ'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label='Người nhận'
                                                    placeholder='Tìm theo tên nhân sự'
                                                    helperText={selectedAssignmentUserOption ? `Đã chọn: ${selectedAssignmentUserOption.name}` : 'Có thể bỏ trống nếu chỉ bàn giao cho phòng ban.'}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            size='small'
                                            options={options.departments}
                                            value={selectedAssignmentDepartmentOption}
                                            onChange={(_, value) => setForm((p) => ({ ...p, department_id: value?.id || '' }))}
                                            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                                            getOptionLabel={(option) => option?.name || ''}
                                            renderOption={(props, option) => (
                                                <Box component='li' {...props}>
                                                    <Box>
                                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                            {option.name}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {[option.code, option.organization?.name].filter(Boolean).join(' • ') || 'Phòng ban nội bộ'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label='Phòng ban nhận'
                                                    placeholder='Tìm phòng ban'
                                                    helperText={selectedAssignmentDepartmentOption ? `Đã chọn: ${selectedAssignmentDepartmentOption.name}` : 'Có thể bỏ trống nếu bàn giao trực tiếp cho nhân sự.'}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Thời gian
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Ghi nhận thời điểm bàn giao và mốc dự kiến hoàn trả nếu có.
                                    </Typography>
                                </Box>

                                <TextField
                                    type='datetime-local'
                                    label='Thời gian bàn giao'
                                    fullWidth
                                    size='small'
                                    InputLabelProps={{ shrink: true }}
                                    value={form.assigned_at}
                                    onChange={(e) => setForm((p) => ({ ...p, assigned_at: e.target.value }))}
                                />

                                <TextField
                                    type='datetime-local'
                                    label='Dự kiến hoàn trả'
                                    fullWidth
                                    size='small'
                                    InputLabelProps={{ shrink: true }}
                                    value={form.due_back_at}
                                    onChange={(e) => setForm((p) => ({ ...p, due_back_at: e.target.value }))}
                                    helperText='Để trống nếu chưa có thời hạn hoàn trả.'
                                />

                                <Box
                                    sx={{
                                        px: 1.5,
                                        py: 1.25,
                                        borderRadius: 2,
                                        border: '1px dashed',
                                        borderColor: 'divider',
                                        bgcolor: 'background.default',
                                    }}
                                >
                                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                        Tóm tắt
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                        {selectedAssignmentAssetOption ? `${selectedAssignmentAssetOption.asset_code} đang được chuẩn bị bàn giao.` : 'Chưa chọn tài sản.'}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                                        {selectedAssignmentUserOption || selectedAssignmentDepartmentOption
                                            ? `Bên nhận: ${selectedAssignmentUserOption?.name || 'Chưa chọn người'}${selectedAssignmentDepartmentOption ? ` • ${selectedAssignmentDepartmentOption.name}` : ''}`
                                            : 'Chưa chọn bên nhận.'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            );
        }

        if (tab === 'maintenances') {
            return (
                <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={7}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Thông tin bảo trì
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Chọn tài sản, khai báo loại công việc và nội dung cần thực hiện.
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Autocomplete
                                            size='small'
                                            options={options.assets}
                                            value={selectedMaintenanceAssetOption}
                                            onChange={(_, value) => setForm((p) => ({ ...p, asset_id: value?.id || '' }))}
                                            isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                                            getOptionLabel={(option) => option ? `${option.asset_code} - ${option.name}` : ''}
                                            renderOption={(props, option) => (
                                                <Box component='li' {...props}>
                                                    <Box>
                                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                            {option.asset_code} - {option.name}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {[option.category?.name, option.condition_status, option.location_status].filter(Boolean).join(' • ') || 'Tài sản nội bộ'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label='Tài sản'
                                                    placeholder='Tìm theo mã hoặc tên tài sản'
                                                    helperText={selectedMaintenanceAssetOption ? `Đang chọn: ${selectedMaintenanceAssetOption.asset_code}` : 'Chọn tài sản cần bảo trì.'}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            label='Tiêu đề công việc'
                                            fullWidth
                                            size='small'
                                            placeholder='Ví dụ: Vệ sinh định kỳ, thay pin, sửa bàn phím...'
                                            value={form.title}
                                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField select label='Loại công việc' fullWidth size='small' value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                                            {['maintenance', 'repair', 'warranty'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField select label='Trạng thái' fullWidth size='small' value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                                            {['scheduled', 'in_progress', 'completed', 'cancelled'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Box sx={formSectionSx}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Kế hoạch thực hiện
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Ghi nhận thời gian dự kiến và chi phí liên quan nếu đã xác định.
                                    </Typography>
                                </Box>

                                <TextField
                                    type='datetime-local'
                                    label='Thời gian dự kiến'
                                    fullWidth
                                    size='small'
                                    InputLabelProps={{ shrink: true }}
                                    value={form.scheduled_at}
                                    onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                                />

                                <TextField
                                    type='number'
                                    label='Chi phí'
                                    fullWidth
                                    size='small'
                                    value={form.cost}
                                    onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                                    helperText='Để trống nếu chưa có chi phí cụ thể.'
                                />

                                <Box
                                    sx={{
                                        px: 1.5,
                                        py: 1.25,
                                        borderRadius: 2,
                                        border: '1px dashed',
                                        borderColor: 'divider',
                                        bgcolor: 'background.default',
                                    }}
                                >
                                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                        Tóm tắt
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                        {selectedMaintenanceAssetOption ? `${selectedMaintenanceAssetOption.asset_code} sẽ được xử lý theo loại ${form.type || 'maintenance'}.` : 'Chưa chọn tài sản bảo trì.'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            );
        }

        return (
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={5}>
                    <Box sx={formSectionSx}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                    Phạm vi kiểm kê
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    Chọn phòng ban, thời điểm kiểm kê và trạng thái đợt kiểm kê.
                                </Typography>
                            </Box>

                            <Autocomplete
                                size='small'
                                options={options.departments}
                                value={selectedAuditDepartmentOption}
                                onChange={(_, value) => handleAuditDepartmentChange(value?.id || '')}
                                isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                                getOptionLabel={(option) => option?.name || ''}
                                renderOption={(props, option) => (
                                    <Box component='li' {...props}>
                                        <Box>
                                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                {option.name}
                                            </Typography>
                                            <Typography variant='caption' color='text.secondary'>
                                                {[option.code, option.organization?.name].filter(Boolean).join(' • ') || 'Phòng ban nội bộ'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label='Phòng ban'
                                        placeholder='Chọn phòng ban cần kiểm kê'
                                        helperText={selectedAuditDepartmentOption ? `Đang kiểm kê: ${selectedAuditDepartmentOption.name}` : 'Để trống để kiểm kê toàn bộ tài sản trong scope hiện tại.'}
                                    />
                                )}
                            />

                            <TextField
                                type='datetime-local'
                                label='Thời điểm kiểm kê'
                                fullWidth
                                size='small'
                                InputLabelProps={{ shrink: true }}
                                value={form.audited_at}
                                onChange={(e) => setForm((p) => ({ ...p, audited_at: e.target.value }))}
                            />

                            <TextField
                                select
                                label='Trạng thái'
                                fullWidth
                                size='small'
                                value={form.status}
                                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                            >
                                {['planned', 'in_progress', 'completed'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                            </TextField>

                            <TextField
                                label='Ghi chú'
                                fullWidth
                                size='small'
                                multiline
                                minRows={3}
                                value={form.notes}
                                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                            />
                        </Stack>
                    </Box>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Box sx={formSectionSx}>
                        <Stack spacing={1.5}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent='space-between'>
                                <Box>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Checklist kiểm kê
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Chọn tài sản tham gia đợt kiểm kê và ghi nhận vị trí thực tế.
                                    </Typography>
                                </Box>
                                <Typography variant='body2' color='text.secondary'>
                                    {`${(form.items || []).filter((item) => item.included).length} đã chọn / ${auditScopedAssets.length} tài sản`}
                                </Typography>
                            </Stack>

                            <Stack spacing={1.5}>
                                {(form.items || []).map((item) => {
                                    const asset = auditScopedAssets.find((entry) => Number(entry.id) === Number(item.asset_id));
                                    if (!asset) {
                                        return null;
                                    }

                                    return (
                                        <Box key={item.asset_id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                            <Grid container spacing={1.5} alignItems='center'>
                                                <Grid item xs={12} md={3}>
                                                    <FormControlLabel
                                                        control={<Checkbox checked={!!item.included} onChange={(e) => handleAuditItemChange(item.asset_id, 'included', e.target.checked)} />}
                                                        label={
                                                            <Box>
                                                                <Typography variant='body2' sx={{ fontWeight: 600 }}>{asset.asset_code}</Typography>
                                                                <Typography variant='caption' color='text.secondary'>{asset.name}</Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size='small'
                                                        label='Vị trí kỳ vọng'
                                                        value={item.expected_location_status}
                                                        onChange={(e) => handleAuditItemChange(item.asset_id, 'expected_location_status', e.target.value)}
                                                    >
                                                        {LOCATION_OPTIONS.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size='small'
                                                        label='Vị trí thực tế'
                                                        value={item.actual_location_status}
                                                        onChange={(e) => handleAuditItemChange(item.asset_id, 'actual_location_status', e.target.value)}
                                                    >
                                                        {LOCATION_OPTIONS.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size='small'
                                                        label='Kết quả'
                                                        value={item.result_status}
                                                        onChange={(e) => handleAuditItemChange(item.asset_id, 'result_status', e.target.value)}
                                                    >
                                                        {AUDIT_RESULT_OPTIONS.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        size='small'
                                                        label='Ghi chú tài sản'
                                                        value={item.notes || ''}
                                                        onChange={(e) => handleAuditItemChange(item.asset_id, 'notes', e.target.value)}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    );
                                })}
                                {auditScopedAssets.length === 0 && <Typography variant='body2' color='text.secondary'>No assets available for the selected department.</Typography>}
                            </Stack>
                        </Stack>
                    </Box>
                </Grid>
            </Grid>
        );
    };

    return (
        <MainCard totalCount={tab === 'reports' ? undefined : totals[tab]}>
            <MetaData title='Asset Management' description='Company asset management module' />
            <Stack spacing={2}>
                <Box>
                    <Typography variant='h5' sx={{ fontWeight: 600 }}>Asset Management</Typography>
                    <Typography variant='body2' color='text.secondary'>Manage categories, assets, allocation, maintenance, audits and reports.</Typography>
                </Box>

                <Tabs value={tab} onChange={(_, value) => setTab(value)} variant='scrollable' allowScrollButtonsMobile>
                    {Object.entries(TABS).map(([value, label]) => <Tab key={value} value={value} label={label} />)}
                </Tabs>

                {tab !== 'reports' && (
                    <Stack spacing={1.5}>
                        <Toolbar
                            loadData={() => {
                                showLoading();
                                loadTab(tab)
                                    .catch((err) => showNotification(err.response?.data?.message || 'Failed to load data', 'error'))
                                    .finally(hideLoading);
                            }}
                            handleSearch={handleSearch}
                            handleAdd={openCreate}
                            handleDelete={handleDelete}
                            deleteDisabled={selectedRows.length === 0}
                            showDownload={false}
                            showOption={false}
                            searchValue={keyword}
                            onSearchValueChange={setKeyword}
                        />

                        {tab === 'assets' && (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap='wrap'>
                                <Button
                                    variant='outlined'
                                    disabled={selectedRows.length === 0}
                                    onClick={() => handlePrintQr((rows.assets || []).filter((item) => selectedRows.includes(item.id)))}
                                    sx={actionButtonSx}
                                >
                                    Print QR
                                </Button>
                                <Button variant='outlined' onClick={handleExportAssetsExcel} sx={actionButtonSx}>
                                    Export XLSX
                                </Button>
                                <Button variant='outlined' onClick={handleExportAssetsCsv} sx={actionButtonSx}>
                                    Export CSV
                                </Button>
                            </Stack>
                        )}

                        {tab === 'assets' && (
                            <Stack spacing={1.5}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                    <TextField
                                        select
                                        size='small'
                                        label='Category'
                                        value={assetFilters.category_id}
                                        onChange={(e) => handleAssetFilterChange('category_id', e.target.value)}
                                        sx={{ minWidth: { xs: '100%', md: 220 } }}
                                    >
                                        <MenuItem value=''>All categories</MenuItem>
                                        {options.categories.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        select
                                        size='small'
                                        label='Department'
                                        value={assetFilters.department_id}
                                        onChange={(e) => handleAssetFilterChange('department_id', e.target.value)}
                                        sx={{ minWidth: { xs: '100%', md: 220 } }}
                                    >
                                        <MenuItem value=''>All departments</MenuItem>
                                        {options.departments.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        select
                                        size='small'
                                        label='Location'
                                        value={assetFilters.location_status}
                                        onChange={(e) => handleAssetFilterChange('location_status', e.target.value)}
                                        sx={{ minWidth: { xs: '100%', md: 180 } }}
                                    >
                                        <MenuItem value=''>All locations</MenuItem>
                                        {LOCATION_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        select
                                        size='small'
                                        label='Condition'
                                        value={assetFilters.condition_status}
                                        onChange={(e) => handleAssetFilterChange('condition_status', e.target.value)}
                                        sx={{ minWidth: { xs: '100%', md: 180 } }}
                                    >
                                        <MenuItem value=''>All conditions</MenuItem>
                                        {CONDITION_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        select
                                        size='small'
                                        label='Status'
                                        value={assetFilters.is_active}
                                        onChange={(e) => handleAssetFilterChange('is_active', e.target.value)}
                                        sx={{ minWidth: { xs: '100%', md: 160 } }}
                                    >
                                        <MenuItem value=''>All status</MenuItem>
                                        <MenuItem value='1'>Active</MenuItem>
                                        <MenuItem value='0'>Inactive</MenuItem>
                                    </TextField>
                                    <Button variant='text' onClick={() => { setKeyword(DEFAULT_ASSET_VIEW_OPTIONS.assetKeyword); setAssetFilters(DEFAULT_ASSET_VIEW_OPTIONS.assetFilters); setAssetSortModel(DEFAULT_ASSET_VIEW_OPTIONS.assetSortModel); }}>Reset</Button>
                                </Stack>

                                <Grid container spacing={1.5}>
                                    {[
                                        ['Filtered Assets', assetSummary.total, 'total', false],
                                        ['Active', assetSummary.active, 'active', assetFilters.is_active === '1'],
                                        ['In Use', assetSummary.inUse, 'in_use', assetFilters.location_status === 'in_use'],
                                        ['In Storage', assetSummary.storage, 'storage', assetFilters.location_status === 'storage'],
                                        ['Warranty < 30d', assetSummary.warrantySoon],
                                    ].map(([label, value, action, active]) => (
                                        <Grid item xs={6} sm={4} md={12} key={label} sx={{ flexBasis: { md: '20%' }, maxWidth: { md: '20%' } }}>
                                            <Box
                                                onClick={action ? () => handleAssetSummaryFilter(action) : undefined}
                                                sx={{
                                                    p: 1.5,
                                                    border: '1px solid',
                                                    borderColor: active ? 'primary.main' : 'divider',
                                                    borderRadius: 2,
                                                    cursor: action ? 'pointer' : 'default',
                                                    bgcolor: active ? 'action.selected' : 'transparent',
                                                }}
                                            >
                                                <Typography variant='caption' color='text.secondary'>{label}</Typography>
                                                <Typography variant='h6' sx={{ mt: 0.5, fontWeight: 600 }}>{value}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Stack>
                        )}

                        {tab === 'maintenances' && (
                            <Grid container spacing={1.5}>
                                {[
                                    ['Total', maintenanceSummary.total, 'total', !maintenanceFilters.status && !maintenanceFilters.type],
                                    ['Scheduled', maintenanceSummary.scheduled, 'scheduled', maintenanceFilters.status === 'scheduled'],
                                    ['In Progress', maintenanceSummary.inProgress, 'in_progress', maintenanceFilters.status === 'in_progress'],
                                    ['Completed', maintenanceSummary.completed, 'completed', maintenanceFilters.status === 'completed'],
                                    ['Repair', maintenanceSummary.repair, 'repair', maintenanceFilters.type === 'repair'],
                                ].map(([label, value, action, active]) => (
                                    <Grid item xs={6} sm={4} md={12} key={label} sx={{ flexBasis: { md: '20%' }, maxWidth: { md: '20%' } }}>
                                        <Box
                                            onClick={() => handleMaintenanceSummaryFilter(action)}
                                            sx={{
                                                p: 1.5,
                                                border: '1px solid',
                                                borderColor: active ? 'primary.main' : 'divider',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                bgcolor: active ? 'action.selected' : 'transparent',
                                            }}
                                        >
                                            <Typography variant='caption' color='text.secondary'>{label}</Typography>
                                            <Typography variant='h6' sx={{ mt: 0.5, fontWeight: 600 }}>{value}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {tab === 'audits' && (
                            <Grid container spacing={1.5}>
                                {[
                                    ['Total', auditSummary.total, 'total', !auditFilters.status && !auditFilters.mismatch_only],
                                    ['Planned', auditSummary.planned, 'planned', auditFilters.status === 'planned'],
                                    ['In Progress', auditSummary.inProgress, 'in_progress', auditFilters.status === 'in_progress'],
                                    ['Completed', auditSummary.completed, 'completed', auditFilters.status === 'completed'],
                                    ['Mismatch', auditSummary.mismatch, 'mismatch', auditFilters.mismatch_only === '1'],
                                ].map(([label, value, action, active]) => (
                                    <Grid item xs={6} sm={4} md={12} key={label} sx={{ flexBasis: { md: '20%' }, maxWidth: { md: '20%' } }}>
                                        <Box
                                            onClick={() => handleAuditSummaryFilter(action)}
                                            sx={{
                                                p: 1.5,
                                                border: '1px solid',
                                                borderColor: active ? 'primary.main' : 'divider',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                bgcolor: active ? 'action.selected' : 'transparent',
                                            }}
                                        >
                                            <Typography variant='caption' color='text.secondary'>{label}</Typography>
                                            <Typography variant='h6' sx={{ mt: 0.5, fontWeight: 600 }}>{value}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Stack>
                )}

                {tab === 'reports' && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent='flex-end' useFlexGap flexWrap='wrap'>
                        <Button variant='outlined' onClick={() => { showLoading(); loadTab('reports').finally(hideLoading); }} sx={actionButtonSx}>Reload</Button>
                        <Button variant='outlined' onClick={handleExportReportExcel} sx={actionButtonSx}>Export XLSX</Button>
                        <Button variant='outlined' onClick={handleExportReportCsv} sx={actionButtonSx}>Export CSV</Button>
                        <Button variant='contained' onClick={handlePrintReport} sx={actionButtonSx}>Print Report</Button>
                    </Stack>
                )}

                {tab !== 'reports' ? (
                    <DataGrid
                        autoHeight
                        rows={rows[tab] || []}
                        columns={columns[tab] || []}
                        sortingMode={tab === 'assets' ? 'server' : 'client'}
                        sortModel={tab === 'assets' ? assetSortModel : undefined}
                        onSortModelChange={tab === 'assets' ? handleAssetSortChange : undefined}
                        checkboxSelection
                        disableRowSelectionOnClick
                        onRowDoubleClick={(params) => openEdit(params.row)}
                        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                        pageSizeOptions={[10, 25, 50]}
                        rowHeight={tab === 'assets' ? 60 : undefined}
                        onRowSelectionModelChange={(newSelection) => {
                            const ids = Array.isArray(newSelection) ? newSelection : Array.from(newSelection?.ids || []);
                            setSelectedRows(ids);
                        }}
                    />
                ) : (
                    <Grid container spacing={2}>
                        {[
                            ['Total Assets', report.summary?.total_assets || 0],
                            ['In Use', report.summary?.in_use_assets || 0],
                            ['In Storage', report.summary?.storage_assets || 0],
                            ['Warranty Expiring', report.summary?.warranty_expiring_count || 0],
                            ['Damaged / Lost', report.summary?.damaged_or_lost_count || 0],
                            ['Disposed', report.summary?.disposed_count || 0],
                        ].map(([label, value]) => (
                            <Grid item xs={12} sm={6} md={4} key={label}>
                                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <Typography variant='body2' color='text.secondary'>{label}</Typography>
                                    <Typography variant='h5' sx={{ mt: 1, fontWeight: 600 }}>{value}</Typography>
                                </Box>
                            </Grid>
                        ))}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>Assets By Department</Typography>
                                <Stack spacing={1}>{(report.by_department || []).map((item) => <Stack key={item.label} direction='row' justifyContent='space-between'><Typography variant='body2'>{item.label}</Typography><Typography variant='body2'>{item.count}</Typography></Stack>)}</Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>Assets By Status</Typography>
                                <Stack spacing={1}>{(report.by_location_status || []).map((item) => <Stack key={item.label} direction='row' justifyContent='space-between'><Typography variant='body2'>{item.label}</Typography><Typography variant='body2'>{item.count}</Typography></Stack>)}</Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>Warranty Expiring</Typography>
                                <Stack spacing={1.25}>
                                    {(report.warranty_expiring || []).map((asset) => (
                                        <Box key={asset.id}>
                                            <Typography variant='body2' sx={{ fontWeight: 600 }}>{asset.asset_code} - {asset.name}</Typography>
                                            <Typography variant='caption' color='text.secondary'>{asset.department?.name || 'Unassigned'} - {toDate(asset.warranty_end_date)}</Typography>
                                        </Box>
                                    ))}
                                    {(report.warranty_expiring || []).length === 0 && <Typography variant='body2' color='text.secondary'>No assets nearing warranty expiry.</Typography>}
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>Damaged / Lost</Typography>
                                <Stack spacing={1.25}>
                                    {(report.damaged_or_lost || []).map((asset) => (
                                        <Box key={asset.id}>
                                            <Typography variant='body2' sx={{ fontWeight: 600 }}>{asset.asset_code} - {asset.name}</Typography>
                                            <Typography variant='caption' color='text.secondary'>{asset.condition_status} - {asset.department?.name || 'Unassigned'}</Typography>
                                        </Box>
                                    ))}
                                    {(report.damaged_or_lost || []).length === 0 && <Typography variant='body2' color='text.secondary'>No damaged or lost assets.</Typography>}
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>Disposed Assets</Typography>
                                <Stack spacing={1.25}>
                                    {(report.disposed_assets || []).map((asset) => (
                                        <Box key={asset.id}>
                                            <Typography variant='body2' sx={{ fontWeight: 600 }}>{asset.asset_code} - {asset.name}</Typography>
                                            <Typography variant='caption' color='text.secondary'>{asset.department?.name || 'Unassigned'}</Typography>
                                        </Box>
                                    ))}
                                    {(report.disposed_assets || []).length === 0 && <Typography variant='body2' color='text.secondary'>No disposed assets.</Typography>}
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </Stack>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
                <DialogTitle>{editingRecord ? 'Edit' : 'Add'} {TABS[tab] || 'Record'}</DialogTitle>
                <DialogContent>{renderForm()}</DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpen(false); setEditingRecord(null); }}>Close</Button>
                    <Button variant='contained' onClick={handleSubmit}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='lg' fullWidth>
                <DialogTitle>Asset Detail</DialogTitle>
                <DialogContent>
                    {detailAsset ? (
                        <Stack spacing={3}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                        <Typography variant='subtitle2' sx={{ mb: 1 }}>QR Code</Typography>
                                        {getQrValue(detailAsset) ? <QrThumb value={getQrValue(detailAsset)} size={220} /> : <Typography variant='body2' color='text.secondary'>No QR</Typography>}
                                        <Stack direction='row' spacing={1} sx={{ mt: 2 }}>
                                            <Button size='small' variant='outlined' onClick={() => handleDownloadQr(detailAsset)}>Download QR</Button>
                                            <Button size='small' variant='outlined' onClick={() => handlePrintQr([detailAsset])}>Print QR</Button>
                                        </Stack>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                        <Typography variant='h6'>{detailAsset.name}</Typography>
                                        <Typography variant='body2' color='text.secondary'>{detailAsset.asset_code} / {detailAsset.qr_code}</Typography>
                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            <Grid item xs={12} sm={6}><Typography variant='body2'><strong>Category:</strong> {detailAsset.category?.name || '-'}</Typography></Grid>
                                            <Grid item xs={12} sm={6}><Typography variant='body2'><strong>Department:</strong> {detailAsset.department?.name || '-'}</Typography></Grid>
                                            <Grid item xs={12} sm={6}><Typography variant='body2'><strong>Current User:</strong> {detailAsset.current_user?.name || '-'}</Typography></Grid>
                                            <Grid item xs={12} sm={6}><Typography variant='body2'><strong>Location:</strong> {detailAsset.location_status || '-'}</Typography></Grid>
                                            <Grid item xs={12} sm={6}><Typography variant='body2'><strong>Condition:</strong> {detailAsset.condition_status || '-'}</Typography></Grid>
                                            <Grid item xs={12} sm={6}><Typography variant='body2'><strong>Warranty End:</strong> {toDate(detailAsset.warranty_end_date)}</Typography></Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant='subtitle2' sx={{ mb: 1.5 }}>Images</Typography>
                                <Grid container spacing={2}>
                                    {(detailAsset.gallery_images || []).map((image, index) => (
                                        <Grid item xs={6} sm={4} md={3} key={image.id}>
                                            <Stack
                                                spacing={1}
                                                draggable
                                                onDragStart={() => setDraggedImageId(image.id)}
                                                onDragOver={(event) => event.preventDefault()}
                                                onDrop={() => handleGalleryReorder(draggedImageId, image.id)}
                                                sx={{
                                                    p: 1,
                                                    border: '1px solid',
                                                    borderColor: draggedImageId === image.id ? 'primary.main' : 'divider',
                                                    borderRadius: 2,
                                                    bgcolor: index === 0 ? 'action.hover' : 'transparent',
                                                    cursor: 'grab',
                                                }}
                                            >
                                                <Box component='img' src={image.url} alt={image.name} sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
                                                <Typography variant='caption' color='text.secondary'>
                                                    {index === 0 ? 'Primary image' : `Gallery image ${index + 1}`}
                                                </Typography>
                                                <Stack spacing={1}>
                                                    <Button size='small' variant='outlined' disabled={index === 0} onClick={() => handleSetPrimaryImage(image.id)}>Set primary</Button>
                                                    <Button size='small' color='error' variant='outlined' onClick={() => handleDeleteGalleryImage(image.id)}>Delete image</Button>
                                                </Stack>
                                            </Stack>
                                        </Grid>
                                    ))}
                                    {(detailAsset.gallery_images || []).length === 0 && <Grid item xs={12}><Typography variant='body2' color='text.secondary'>No images uploaded</Typography></Grid>}
                                </Grid>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                                        <Typography variant='subtitle2' sx={{ mb: 1.5 }}>Assignment History</Typography>
                                        <Stack spacing={1.5}>
                                            {(detailAsset.assignments || []).map((assignment) => (
                                                <Box key={assignment.id}>
                                                    <Typography variant='body2'><strong>{assignment.user?.name || 'Unassigned'}</strong> - {assignment.status}</Typography>
                                                    <Typography variant='caption' color='text.secondary'>{toDateTime(assignment.assigned_at)}{assignment.returned_at ? ` -> ${toDateTime(assignment.returned_at)}` : ''}</Typography>
                                                </Box>
                                            ))}
                                            {(detailAsset.assignments || []).length === 0 && <Typography variant='body2' color='text.secondary'>No assignment history</Typography>}
                                        </Stack>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                                        <Typography variant='subtitle2' sx={{ mb: 1.5 }}>Maintenance History</Typography>
                                        <Stack spacing={1.5}>
                                            {(detailAsset.maintenances || []).map((maintenance) => (
                                                <Box key={maintenance.id}>
                                                    <Typography variant='body2'><strong>{maintenance.title}</strong> - {maintenance.status}</Typography>
                                                    <Typography variant='caption' color='text.secondary'>{`${maintenance.type} | ${toDateTime(maintenance.scheduled_at)} | ${maintenance.cost || 0}`}</Typography>
                                                </Box>
                                            ))}
                                            {(detailAsset.maintenances || []).length === 0 && <Typography variant='body2' color='text.secondary'>No maintenance history</Typography>}
                                        </Stack>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Stack>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={imagePreview.open} onClose={() => setImagePreview({ open: false, src: '', title: '' })} maxWidth='md' fullWidth>
                <DialogTitle>{imagePreview.title || 'Image Preview'}</DialogTitle>
                <DialogContent>
                    {imagePreview.src ? (
                        <Box component='img' src={imagePreview.src} alt={imagePreview.title || 'Asset Preview'} sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }} />
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImagePreview({ open: false, src: '', title: '' })}>Close</Button>
                </DialogActions>
            </Dialog>
        </MainCard>
    );
}
