<?php

namespace App\Services\Concretes;

use App\Models\Department;
use App\Models\Organization;
use App\Models\RecruitmentSetting;
use App\Repositories\RecruitmentSetting\Contracts\RecruitmentSettingRepositoryInterface;
use App\Services\Contracts\RecruitmentSettingServiceInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecruitmentSettingService implements RecruitmentSettingServiceInterface
{
    public function __construct(
        protected RecruitmentSettingRepositoryInterface $recruitmentSettingRepository
    ) {}

    public function getSettings(?int $organizationId = null): RecruitmentSetting
    {
        $resolvedOrganizationId = $this->resolveOrganizationId($organizationId);
        $settings = RecruitmentSetting::query()
            ->with(['organization', 'leadershipDepartment', 'hrDepartment'])
            ->where('organization_id', $resolvedOrganizationId)
            ->first();

        if ($settings) {
            return $settings;
        }

        return RecruitmentSetting::query()->create([
            'organization_id' => $resolvedOrganizationId,
        ]);
    }

    public function updateSettings(array $data, ?int $organizationId = null): RecruitmentSetting
    {
        $resolvedOrganizationId = $this->resolveOrganizationId($organizationId);

        return DB::transaction(function () use ($data, $resolvedOrganizationId) {
            $settings = $this->getSettings($resolvedOrganizationId);

            $leadershipDepartmentId = $data['leadership_department_id'] ?? null;
            $hrDepartmentId = $data['hr_department_id'] ?? null;

            $this->validateDepartmentBelongsOrganization($leadershipDepartmentId, $resolvedOrganizationId, 'leadership_department_id');
            $this->validateDepartmentBelongsOrganization($hrDepartmentId, $resolvedOrganizationId, 'hr_department_id');

            $settings->fill($data);
            $settings->organization_id = $resolvedOrganizationId;
            $settings->save();

            return $settings->load(['organization', 'leadershipDepartment', 'hrDepartment']);
        });
    }

    private function resolveOrganizationId(?int $organizationId = null): int
    {
        $authUser = Auth::user()?->loadMissing('detail');
        $authOrganizationId = (int) ($authUser?->detail?->organization_id ?? 0);

        if ($authOrganizationId > 0) {
            if ($organizationId && $organizationId !== $authOrganizationId && !$authUser?->isAdmin()) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot access recruitment settings of another organization.',
                ]);
            }

            return $organizationId ?: $authOrganizationId;
        }

        if ($organizationId && $authUser?->isAdmin()) {
            return $organizationId;
        }

        if ($authUser?->isAdmin()) {
            $fallbackOrganizationId = Organization::query()->orderBy('id')->value('id');
            if ($fallbackOrganizationId) {
                return (int) $fallbackOrganizationId;
            }
        }

        throw ValidationException::withMessages([
            'organization_id' => 'Organization context is required.',
        ]);
    }

    private function validateDepartmentBelongsOrganization(?int $departmentId, int $organizationId, string $field): void
    {
        if (!$departmentId) {
            return;
        }

        $belongs = Department::query()
            ->where('id', $departmentId)
            ->where('organization_id', $organizationId)
            ->exists();

        if (!$belongs) {
            throw ValidationException::withMessages([
                $field => 'Department must belong to the same organization.',
            ]);
        }
    }
}
