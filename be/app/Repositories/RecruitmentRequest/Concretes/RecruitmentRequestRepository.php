<?php

namespace App\Repositories\RecruitmentRequest\Concretes;

use App\Models\RecruitmentRequest;
use App\Repositories\Base\Concretes\QueryableRepository;
use App\Repositories\RecruitmentRequest\Contracts\RecruitmentRequestRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class RecruitmentRequestRepository extends QueryableRepository implements RecruitmentRequestRepositoryInterface
{
    protected function model(): string
    {
        return RecruitmentRequest::class;
    }

    public function getRecruitmentRequests(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveRecruitmentRequests(): Collection
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
            AllowedFilter::exact('requested_by_user_id'),
            AllowedFilter::exact('requesting_department_id'),
            AllowedFilter::exact('requesting_department_title_id'),
            AllowedFilter::exact('hr_department_id'),
            AllowedFilter::exact('status'),
            'request_no',
            'requested_position',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return [
            'id',
            'request_no',
            'organization_id',
            'requested_by_user_id',
            'requesting_department_id',
            'requesting_department_title_id',
            'hr_department_id',
            'status',
            'quantity',
            'received_at',
            'status_updated_at',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }

    public function getAllowedIncludes(): array
    {
        return [
            'organization',
            'requestedBy',
            'requestingDepartment',
            'requestingDepartmentTitle',
            'hrDepartment',
            'receivedBy',
            'hires',
            'hires.user',
        ];
    }

    public function getAllowedFields(): array
    {
        return [
            'id',
            'request_no',
            'organization_id',
            'requested_by_user_id',
            'requesting_department_id',
            'requesting_department_title_id',
            'hr_department_id',
            'requested_position',
            'quantity',
            'reason',
            'note',
            'status',
            'received_by_user_id',
            'received_at',
            'status_updated_at',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }
}
