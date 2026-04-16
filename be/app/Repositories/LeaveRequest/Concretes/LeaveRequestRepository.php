<?php

namespace App\Repositories\LeaveRequest\Concretes;

use App\Models\LeaveRequest;
use App\Repositories\Base\Concretes\QueryableRepository;
use App\Repositories\LeaveRequest\Contracts\LeaveRequestRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class LeaveRequestRepository extends QueryableRepository implements LeaveRequestRepositoryInterface
{
    protected function model(): string
    {
        return LeaveRequest::class;
    }

    public function getLeaveRequests(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveLeaveRequests(): Collection
    {
        return $this->model->where('is_active', true)->get();
    }

    public function bulkDelete(array $ids): int
    {
        return $this->model->whereIn('id', $ids)->delete();
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('id'),
            AllowedFilter::exact('organization_id'),
            AllowedFilter::exact('user_id'),
            AllowedFilter::exact('department_id'),
            AllowedFilter::exact('department_title_id'),
            AllowedFilter::exact('approver_user_id'),
            AllowedFilter::exact('leave_type'),
            AllowedFilter::exact('status'),
            'request_no',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return [
            'id',
            'request_no',
            'organization_id',
            'user_id',
            'department_id',
            'department_title_id',
            'leave_type',
            'start_date',
            'end_date',
            'total_days',
            'status',
            'approved_at',
            'rejected_at',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }

    public function getAllowedIncludes(): array
    {
        return ['organization', 'user', 'department', 'departmentTitle', 'approver'];
    }

    public function getAllowedFields(): array
    {
        return [
            'id',
            'request_no',
            'organization_id',
            'user_id',
            'department_id',
            'department_title_id',
            'approver_user_id',
            'leave_type',
            'start_date',
            'end_date',
            'total_days',
            'reason',
            'rejection_reason',
            'status',
            'approved_at',
            'rejected_at',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }
}
