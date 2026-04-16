<?php

namespace App\Repositories\RecruitmentSetting\Concretes;

use App\Models\RecruitmentSetting;
use App\Repositories\Base\Concretes\QueryableRepository;
use App\Repositories\RecruitmentSetting\Contracts\RecruitmentSettingRepositoryInterface;
use Spatie\QueryBuilder\AllowedFilter;

class RecruitmentSettingRepository extends QueryableRepository implements RecruitmentSettingRepositoryInterface
{
    protected function model(): string
    {
        return RecruitmentSetting::class;
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('id'),
            AllowedFilter::exact('organization_id'),
            AllowedFilter::exact('leadership_department_id'),
            AllowedFilter::exact('hr_department_id'),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'organization_id', 'leadership_department_id', 'hr_department_id', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['organization', 'leadershipDepartment', 'hrDepartment'];
    }

    public function getAllowedFields(): array
    {
        return ['id', 'organization_id', 'leadership_department_id', 'hr_department_id', 'created_at', 'updated_at'];
    }
}
