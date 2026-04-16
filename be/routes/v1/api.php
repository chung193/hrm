<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ContractTypeController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\DepartmentTitleController;
use App\Http\Controllers\Api\V1\EmployeeContractController;
use App\Http\Controllers\Api\V1\LeaveRequestController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RecruitmentRequestController;
use App\Http\Controllers\Api\V1\RecruitmentSettingController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\StatisticsController;
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

    Route::get('users/active', [UserController::class, 'active'])->name('users.active');
    Route::get('users/all', [UserController::class, 'all'])->name('users.all');
    Route::apiResource('user', UserController::class)->names('users');
    Route::delete('users', [UserController::class, 'bulkDestroy'])->name('users.bulk_destroy');
    Route::post('/user/{user}/role', [UserController::class, 'assignRoles'])->name('user.assign_roles');
    Route::post('/user-export', [UserController::class, 'export'])->name('users.export');

    Route::post('/media/upload', [UploadFileController::class, 'upload']);
    Route::apiResource('media', MediaController::class)->only(['index', 'store', 'update', 'destroy'])->names('media');
    Route::delete('medias', [MediaController::class, 'bulkDestroy'])->name('media.bulk_destroy');

    Route::get('organization/all', [OrganizationController::class, 'all'])->name('organizations.all');
    Route::get('organization/active', [OrganizationController::class, 'active'])->name('organizations.active');
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
});
