<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\RecruitmentSettingUpdateRequest;
use App\Http\Resources\Api\Recruitment\RecruitmentSettingResource;
use App\Services\Contracts\RecruitmentSettingServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecruitmentSettingController extends BaseApiController
{
    public function __construct(
        protected readonly RecruitmentSettingServiceInterface $recruitmentSettingService
    ) {}

    public function show(Request $request): JsonResponse
    {
        $organizationId = $request->query('organization_id');
        $settings = $this->recruitmentSettingService->getSettings($organizationId !== null ? (int) $organizationId : null);
        return $this->successResponse(new RecruitmentSettingResource($settings->load(['organization', 'leadershipDepartment', 'hrDepartment'])));
    }

    public function update(RecruitmentSettingUpdateRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $settings = $this->recruitmentSettingService->updateSettings(
            $validated,
            isset($validated['organization_id']) ? (int) $validated['organization_id'] : null
        );
        return $this->successResponse(new RecruitmentSettingResource($settings));
    }
}
