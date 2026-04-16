<?php

namespace App\Providers;

use App\Repositories\Asset\Concretes\AssetRepository;
use App\Repositories\Asset\Contracts\AssetRepositoryInterface;
use App\Repositories\AssetAssignment\Concretes\AssetAssignmentRepository;
use App\Repositories\AssetAssignment\Contracts\AssetAssignmentRepositoryInterface;
use App\Repositories\AssetAudit\Concretes\AssetAuditRepository;
use App\Repositories\AssetAudit\Contracts\AssetAuditRepositoryInterface;
use App\Repositories\AssetCategory\Concretes\AssetCategoryRepository;
use App\Repositories\AssetCategory\Contracts\AssetCategoryRepositoryInterface;
use App\Repositories\AssetMaintenance\Concretes\AssetMaintenanceRepository;
use App\Repositories\AssetMaintenance\Contracts\AssetMaintenanceRepositoryInterface;
use App\Repositories\ContractType\Concretes\ContractTypeRepository;
use App\Repositories\ContractType\Contracts\ContractTypeRepositoryInterface;
use App\Repositories\Department\Concretes\DepartmentRepository;
use App\Repositories\Department\Contracts\DepartmentRepositoryInterface;
use App\Repositories\DepartmentTitle\Concretes\DepartmentTitleRepository;
use App\Repositories\DepartmentTitle\Contracts\DepartmentTitleRepositoryInterface;
use App\Repositories\EmployeeContract\Concretes\EmployeeContractRepository;
use App\Repositories\EmployeeContract\Contracts\EmployeeContractRepositoryInterface;
use App\Repositories\LeaveRequest\Concretes\LeaveRequestRepository;
use App\Repositories\LeaveRequest\Contracts\LeaveRequestRepositoryInterface;
use App\Repositories\Organization\Concretes\OrganizationRepository;
use App\Repositories\Organization\Contracts\OrganizationRepositoryInterface;
use App\Repositories\Permission\Contracts\PermissionRepositoryInterface;
use App\Repositories\Permission\Concretes\PermissionRepository;
use App\Repositories\RecruitmentRequest\Concretes\RecruitmentRequestRepository;
use App\Repositories\RecruitmentRequest\Contracts\RecruitmentRequestRepositoryInterface;
use App\Repositories\RecruitmentSetting\Concretes\RecruitmentSettingRepository;
use App\Repositories\RecruitmentSetting\Contracts\RecruitmentSettingRepositoryInterface;
use App\Repositories\Role\Contracts\RoleRepositoryInterface;
use App\Repositories\Role\Concretes\RoleRepository;
use App\Repositories\User\Concretes\UserRepository;
use App\Repositories\User\Contracts\UserRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
        // Register repository bindings here
        $this->app->bind(
            UserRepositoryInterface::class,
            UserRepository::class,
        );

        $this->app->bind(
            OrganizationRepositoryInterface::class,
            OrganizationRepository::class,
        );

        $this->app->bind(
            DepartmentRepositoryInterface::class,
            DepartmentRepository::class,
        );

        $this->app->bind(
            DepartmentTitleRepositoryInterface::class,
            DepartmentTitleRepository::class,
        );

        $this->app->bind(
            ContractTypeRepositoryInterface::class,
            ContractTypeRepository::class,
        );

        $this->app->bind(
            EmployeeContractRepositoryInterface::class,
            EmployeeContractRepository::class,
        );

        $this->app->bind(
            LeaveRequestRepositoryInterface::class,
            LeaveRequestRepository::class,
        );

        $this->app->bind(
            RecruitmentSettingRepositoryInterface::class,
            RecruitmentSettingRepository::class,
        );

        $this->app->bind(
            RecruitmentRequestRepositoryInterface::class,
            RecruitmentRequestRepository::class,
        );

        $this->app->bind(
            RoleRepositoryInterface::class,
            RoleRepository::class,
        );

        $this->app->bind(
            PermissionRepositoryInterface::class,
            PermissionRepository::class,
        );

        $this->app->bind(
            AssetCategoryRepositoryInterface::class,
            AssetCategoryRepository::class,
        );

        $this->app->bind(
            AssetRepositoryInterface::class,
            AssetRepository::class,
        );

        $this->app->bind(
            AssetAssignmentRepositoryInterface::class,
            AssetAssignmentRepository::class,
        );

        $this->app->bind(
            AssetMaintenanceRepositoryInterface::class,
            AssetMaintenanceRepository::class,
        );

        $this->app->bind(
            AssetAuditRepositoryInterface::class,
            AssetAuditRepository::class,
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
