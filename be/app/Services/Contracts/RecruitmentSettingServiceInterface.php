<?php

namespace App\Services\Contracts;

use App\Models\RecruitmentSetting;

interface RecruitmentSettingServiceInterface
{
    public function getSettings(?int $organizationId = null): RecruitmentSetting;

    public function updateSettings(array $data, ?int $organizationId = null): RecruitmentSetting;
}
