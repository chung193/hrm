<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AssetAssignmentController;
use App\Http\Controllers\Api\V1\AssetAuditController;
use App\Http\Controllers\Api\V1\AssetCategoryController;
use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\AssetMaintenanceController;
use App\Http\Controllers\Api\V1\AssetReportController;
use App\Http\Controllers\Api\V1\ChatConversationController;
use App\Http\Controllers\Api\V1\ContractTypeController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\DepartmentTitleController;
use App\Http\Controllers\Api\V1\EmployeeContractController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RecruitmentRequestController;
use App\Http\Controllers\Api\V1\RecruitmentSettingController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\StatisticsController;
use App\Http\Controllers\Api\V1\SystemUserController;
use App\Http\Controllers\Api\V1\UploadFileController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for version 1 of your application.
| These routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group with the prefix "api/v1".
|
*/

Route::get('/ping', function () {
    return 'V1 OK';
});

// Search routes (public)
Route::get('/search', [SearchController::class, 'global'])->name('search.global');
Route::get('/search/users', [SearchController::class, 'users'])->name('search.users');
Route::get('organization/active', [OrganizationController::class, 'active'])->name('organizations.active.public');

Route::name('auth.')
    ->prefix('auth')
    ->group(function () {
        Route::post('register', [AuthController::class, 'register'])->name('register');
        Route::post('login', [AuthController::class, 'login'])->name('login');
        Route::post('forgot', [AuthController::class, 'forgot'])->name('forgot');
        Route::post('reset-password', [AuthController::class, 'reset'])->name('reset');
        Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verify'])->name('verify.email')->middleware('signed');
        Route::post('email/resend', [AuthController::class, 'resend'])->name('resend.verify.email');
        // Protected routes
        Route::group(['middleware' => 'auth:api'], function () {
            Route::get('me', [AuthController::class, 'me'])->name('me');
            Route::put('me', [AuthController::class, 'updateProfile'])->name('me.update');
            Route::patch('change-password', [AuthController::class, 'changePassword'])->name('change-password');
            Route::get('refresh', [AuthController::class, 'refresh'])->name('refresh');
            Route::get('logout', [AuthController::class, 'logout'])->name('logout');
        });
    });

Route::group(['middleware' => 'auth:api'], function () {
    // Statistics routes
    Route::get('/statistics/dashboard', [StatisticsController::class, 'dashboard'])->name('statistics.dashboard');
    Route::get('/statistics/monthly-trends', [StatisticsController::class, 'monthlyTrends'])->name('statistics.monthly-trends');
    Route::get('/statistics/assets/overview', [AssetReportController::class, 'overview'])->name('statistics.assets.overview');
    Route::post('/statistics/assets/export', [AssetReportController::class, 'export'])->name('statistics.assets.export');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread_count');
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read_all');
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/broadcast', [NotificationController::class, 'broadcast'])->name('notifications.broadcast');

    Route::get('users/active', [UserController::class, 'active'])->name('users.active');
    Route::get('users/all', [UserController::class, 'all'])->name('users.all');
    Route::patch('/user/{user}/password', [UserController::class, 'resetPassword'])->name('users.reset_password');
    Route::apiResource('user', UserController::class)->names('users');
    Route::delete('users', [UserController::class, 'bulkDestroy'])->name('users.bulk_destroy');
    Route::post('/user/{user}/role', [UserController::class, 'assignRoles'])->name('user.assign_roles');
    Route::post('/user-export', [UserController::class, 'export'])->name('users.export');
    Route::get('admin-users/active', [SystemUserController::class, 'active'])->name('admin_users.active');
    Route::get('admin-users/all', [SystemUserController::class, 'all'])->name('admin_users.all');
    Route::apiResource('admin-user', SystemUserController::class)->parameters(['admin-user' => 'user'])->names('admin_users');
    Route::delete('admin-users', [SystemUserController::class, 'bulkDestroy'])->name('admin_users.bulk_destroy');
    Route::post('/admin-user/{user}/role', [SystemUserController::class, 'assignRoles'])->name('admin_user.assign_roles');
    Route::patch('/admin-user/{user}/password', [SystemUserController::class, 'resetPassword'])->name('admin_user.reset_password');
    Route::post('/admin-user-export', [SystemUserController::class, 'export'])->name('admin_users.export');

    Route::post('/media/upload', [UploadFileController::class, 'upload']);
    Route::apiResource('media', MediaController::class)->only(['index', 'store', 'update', 'destroy'])->names('media');
    Route::delete('medias', [MediaController::class, 'bulkDestroy'])->name('media.bulk_destroy');

    Route::get('organization/all', [OrganizationController::class, 'all'])->name('organizations.all');
    Route::apiResource('organization', OrganizationController::class)->names('organizations');
    Route::delete('organizations', [OrganizationController::class, 'bulkDestroy'])->name('organizations.bulk_destroy');

    Route::get('department/all', [DepartmentController::class, 'all'])->name('departments.all');
    Route::get('department/active', [DepartmentController::class, 'active'])->name('departments.active');
    Route::apiResource('department', DepartmentController::class)->names('departments');
    Route::delete('departments', [DepartmentController::class, 'bulkDestroy'])->name('departments.bulk_destroy');

    Route::get('department-title/all', [DepartmentTitleController::class, 'all'])->name('department_titles.all');
    Route::get('department-title/active', [DepartmentTitleController::class, 'active'])->name('department_titles.active');
    Route::apiResource('department-title', DepartmentTitleController::class)->names('department_titles');
    Route::delete('department-titles', [DepartmentTitleController::class, 'bulkDestroy'])->name('department_titles.bulk_destroy');

    Route::get('contract-type/all', [ContractTypeController::class, 'all'])->name('contract_types.all');
    Route::get('contract-type/active', [ContractTypeController::class, 'active'])->name('contract_types.active');
    Route::apiResource('contract-type', ContractTypeController::class)->names('contract_types');
    Route::delete('contract-types', [ContractTypeController::class, 'bulkDestroy'])->name('contract_types.bulk_destroy');

    Route::get('employee-contract/all', [EmployeeContractController::class, 'all'])->name('employee_contracts.all');
    Route::get('employee-contract/active', [EmployeeContractController::class, 'active'])->name('employee_contracts.active');
    Route::apiResource('employee-contract', EmployeeContractController::class)->names('employee_contracts');
    Route::delete('employee-contracts', [EmployeeContractController::class, 'bulkDestroy'])->name('employee_contracts.bulk_destroy');

    Route::get('leave-request/all', [LeaveRequestController::class, 'all'])->name('leave_requests.all');
    Route::get('leave-request/active', [LeaveRequestController::class, 'active'])->name('leave_requests.active');
    Route::get('leave-request/calendar', [LeaveRequestController::class, 'calendar'])->name('leave_requests.calendar');
    Route::get('leave-request/balance', [LeaveRequestController::class, 'balance'])->name('leave_requests.balance');
    Route::patch('leave-request/{id}/approve', [LeaveRequestController::class, 'approve'])->name('leave_requests.approve');
    Route::patch('leave-request/{id}/reject', [LeaveRequestController::class, 'reject'])->name('leave_requests.reject');
    Route::apiResource('leave-request', LeaveRequestController::class)->names('leave_requests');
    Route::delete('leave-requests', [LeaveRequestController::class, 'bulkDestroy'])->name('leave_requests.bulk_destroy');

    Route::get('recruitment-setting', [RecruitmentSettingController::class, 'show'])->name('recruitment_settings.show');
    Route::put('recruitment-setting', [RecruitmentSettingController::class, 'update'])->name('recruitment_settings.update');

    Route::get('recruitment-request/all', [RecruitmentRequestController::class, 'all'])->name('recruitment_requests.all');
    Route::get('recruitment-request/active', [RecruitmentRequestController::class, 'active'])->name('recruitment_requests.active');
    Route::patch('recruitment-request/{id}/receive', [RecruitmentRequestController::class, 'receive'])->name('recruitment_requests.receive');
    Route::patch('recruitment-request/{id}/status', [RecruitmentRequestController::class, 'updateStatus'])->name('recruitment_requests.status');
    Route::apiResource('recruitment-request', RecruitmentRequestController::class)->names('recruitment_requests');
    Route::delete('recruitment-requests', [RecruitmentRequestController::class, 'bulkDestroy'])->name('recruitment_requests.bulk_destroy');

    Route::post('/role-export', [RoleController::class, 'export'])->name('roles.export');
    Route::post('/role/{role}/permission', [RoleController::class, 'assignPermissions'])->name('roles.assign_permissions');
    Route::apiResource('role', RoleController::class)->names('roles');
    Route::delete('roles', [RoleController::class, 'bulkDestroy'])->name('roles.bulk_destroy');

    Route::post('/permission-export', [PermissionController::class, 'export'])->name('permissions.export');
    Route::apiResource('permission', PermissionController::class)->names('permissions');
    Route::delete('permissions', [PermissionController::class, 'bulkDestroy'])->name('permissions.bulk_destroy');

    Route::get('asset-category/all', [AssetCategoryController::class, 'all'])->name('asset_categories.all');
    Route::get('asset-category/active', [AssetCategoryController::class, 'active'])->name('asset_categories.active');
    Route::apiResource('asset-category', AssetCategoryController::class)
        ->parameters(['asset-category' => 'asset_category'])
        ->names('asset_categories');
    Route::delete('asset-categories', [AssetCategoryController::class, 'bulkDestroy'])->name('asset_categories.bulk_destroy');

    Route::get('asset/all', [AssetController::class, 'all'])->name('assets.all');
    Route::get('asset/active', [AssetController::class, 'active'])->name('assets.active');
    Route::post('asset-export', [AssetController::class, 'export'])->name('assets.export');
    Route::patch('asset/{asset}/gallery-order', [AssetController::class, 'reorderGallery'])->name('assets.gallery_order');
    Route::patch('asset/{asset}/primary-image', [AssetController::class, 'setPrimaryImage'])->name('assets.primary_image');
    Route::apiResource('asset', AssetController::class)->names('assets');
    Route::delete('assets', [AssetController::class, 'bulkDestroy'])->name('assets.bulk_destroy');

    Route::get('asset-assignment/all', [AssetAssignmentController::class, 'all'])->name('asset_assignments.all');
    Route::get('asset-assignment/active', [AssetAssignmentController::class, 'active'])->name('asset_assignments.active');
    Route::patch('asset-assignment/{asset_assignment}/recall-request', [AssetAssignmentController::class, 'requestRecall'])->name('asset_assignments.recall_request');
    Route::patch('asset-assignment/{asset_assignment}/return', [AssetAssignmentController::class, 'returnAsset'])->name('asset_assignments.return');
    Route::apiResource('asset-assignment', AssetAssignmentController::class)
        ->parameters(['asset-assignment' => 'asset_assignment'])
        ->names('asset_assignments');
    Route::delete('asset-assignments', [AssetAssignmentController::class, 'bulkDestroy'])->name('asset_assignments.bulk_destroy');

    Route::get('chat-conversations', [ChatConversationController::class, 'index'])->name('chat_conversations.index');
    Route::post('chat-conversations', [ChatConversationController::class, 'store'])->name('chat_conversations.store');
    Route::get('chat-conversations/{conversation}/messages', [ChatConversationController::class, 'messages'])->name('chat_conversations.messages');
    Route::post('chat-conversations/{conversation}/messages', [ChatConversationController::class, 'sendMessage'])->name('chat_conversations.send_message');

    Route::get('asset-maintenance/all', [AssetMaintenanceController::class, 'all'])->name('asset_maintenances.all');
    Route::get('asset-maintenance/active', [AssetMaintenanceController::class, 'active'])->name('asset_maintenances.active');
    Route::apiResource('asset-maintenance', AssetMaintenanceController::class)
        ->parameters(['asset-maintenance' => 'asset_maintenance'])
        ->names('asset_maintenances');
    Route::delete('asset-maintenances', [AssetMaintenanceController::class, 'bulkDestroy'])->name('asset_maintenances.bulk_destroy');

    Route::get('asset-audit/all', [AssetAuditController::class, 'all'])->name('asset_audits.all');
    Route::get('asset-audit/active', [AssetAuditController::class, 'active'])->name('asset_audits.active');
    Route::apiResource('asset-audit', AssetAuditController::class)
        ->parameters(['asset-audit' => 'asset_audit'])
        ->names('asset_audits');
    Route::delete('asset-audits', [AssetAuditController::class, 'bulkDestroy'])->name('asset_audits.bulk_destroy');
});
