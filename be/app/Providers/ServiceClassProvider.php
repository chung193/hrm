<?php

namespace App\Providers;

use App\Services\Concretes\AuthService;
use App\Services\Concretes\ContractTypeService;
use App\Services\Concretes\DepartmentService;
use App\Services\Concretes\DepartmentTitleService;
use App\Services\Concretes\EmployeeContractService;
use App\Services\Concretes\LeaveRequestService;
use App\Services\Concretes\OrganizationService;
use App\Services\Concretes\PermissionService;
use App\Services\Concretes\RecruitmentRequestService;
use App\Services\Concretes\RecruitmentSettingService;
use App\Services\Concretes\RoleService;
use App\Services\Concretes\UserService;
use App\Services\Contracts\AuthServiceInterface;
use App\Services\Contracts\ContractTypeServiceInterface;
use App\Services\Contracts\DepartmentServiceInterface;
use App\Services\Contracts\DepartmentTitleServiceInterface;
use App\Services\Contracts\EmployeeContractServiceInterface;
use App\Services\Contracts\LeaveRequestServiceInterface;
use App\Services\Contracts\OrganizationServiceInterface;
use App\Services\Contracts\PermissionServiceInterface;
use App\Services\Contracts\RecruitmentRequestServiceInterface;
use App\Services\Contracts\RecruitmentSettingServiceInterface;
use App\Services\Contracts\RoleServiceInterface;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Support\ServiceProvider as BaseServiceProvider;

class ServiceClassProvider extends BaseServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(UserServiceInterface::class, UserService::class);
        $this->app->bind(RoleServiceInterface::class, RoleService::class);
        $this->app->bind(PermissionServiceInterface::class, PermissionService::class);
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(OrganizationServiceInterface::class, OrganizationService::class);
        $this->app->bind(DepartmentServiceInterface::class, DepartmentService::class);
        $this->app->bind(DepartmentTitleServiceInterface::class, DepartmentTitleService::class);
        $this->app->bind(ContractTypeServiceInterface::class, ContractTypeService::class);
        $this->app->bind(EmployeeContractServiceInterface::class, EmployeeContractService::class);
        $this->app->bind(LeaveRequestServiceInterface::class, LeaveRequestService::class);
        $this->app->bind(RecruitmentSettingServiceInterface::class, RecruitmentSettingService::class);
        $this->app->bind(RecruitmentRequestServiceInterface::class, RecruitmentRequestService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
