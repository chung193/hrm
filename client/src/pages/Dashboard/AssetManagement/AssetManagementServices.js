import { authInstance } from '@services/axios';
import apiService from '@services/common';

export const getAssetCategories = async (params = {}) => authInstance.get('asset-category', { params });
export const getAllAssetCategories = async (params = {}) => authInstance.get('asset-category/all', { params });
export const createAssetCategory = async (data) => authInstance.post('asset-category', data);
export const updateAssetCategory = async (id, data) => authInstance.put(`asset-category/${id}`, data);
export const deleteAssetCategories = async (ids) => authInstance.delete('asset-categories', { data: { ids } });

export const getAssets = async (params = {}) => authInstance.get('asset', { params });
export const getAllAssets = async (params = {}) => authInstance.get('asset/all', { params });
export const exportAssets = async (params = {}) => authInstance.post('asset-export', params, {
    headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    responseType: 'blob',
});
export const showAsset = async (id) => authInstance.get(`asset/${id}`);
export const createAsset = async (data) => {
    if (data instanceof FormData) {
        return apiService.postWithMedia('asset', data);
    }

    return authInstance.post('asset', data);
};
export const updateAsset = async (id, data) => {
    if (data instanceof FormData) {
        return apiService.putWithMedia(`asset/${id}`, data);
    }

    return authInstance.put(`asset/${id}`, data);
};
export const deleteAssets = async (ids) => authInstance.delete('assets', { data: { ids } });
export const reorderAssetGallery = async (id, mediaIds) => authInstance.patch(`asset/${id}/gallery-order`, { media_ids: mediaIds });
export const setPrimaryAssetImage = async (id, mediaId) => authInstance.patch(`asset/${id}/primary-image`, { media_id: mediaId });

export const getAssetAssignments = async (params = {}) => authInstance.get('asset-assignment', { params });
export const createAssetAssignment = async (data) => authInstance.post('asset-assignment', data);
export const updateAssetAssignment = async (id, data) => authInstance.put(`asset-assignment/${id}`, data);
export const requestRecallAssetAssignment = async (id, data = {}) => authInstance.patch(`asset-assignment/${id}/recall-request`, data);
export const returnAssetAssignment = async (id, data = {}) => authInstance.patch(`asset-assignment/${id}/return`, data);
export const deleteAssetAssignments = async (ids) => authInstance.delete('asset-assignments', { data: { ids } });

export const getAssetMaintenances = async (params = {}) => authInstance.get('asset-maintenance', { params });
export const createAssetMaintenance = async (data) => authInstance.post('asset-maintenance', data);
export const updateAssetMaintenance = async (id, data) => authInstance.put(`asset-maintenance/${id}`, data);
export const deleteAssetMaintenances = async (ids) => authInstance.delete('asset-maintenances', { data: { ids } });

export const getAssetAudits = async (params = {}) => authInstance.get('asset-audit', { params });
export const createAssetAudit = async (data) => authInstance.post('asset-audit', data);
export const updateAssetAudit = async (id, data) => authInstance.put(`asset-audit/${id}`, data);
export const deleteAssetAudits = async (ids) => authInstance.delete('asset-audits', { data: { ids } });

export const getAssetReportOverview = async () => authInstance.get('statistics/assets/overview');
export const deleteMedia = async (id) => authInstance.delete(`media/${id}`);
export const exportAssetReport = async () => authInstance.post('statistics/assets/export', {}, {
    headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    responseType: 'blob',
});
