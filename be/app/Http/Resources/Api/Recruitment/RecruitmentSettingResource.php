<?php

namespace App\Http\Resources\Api\Recruitment;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecruitmentSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'leadership_department_id' => $this->leadership_department_id,
            'hr_department_id' => $this->hr_department_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'organization' => $this->whenLoaded('organization'),
            'leadership_department' => $this->whenLoaded('leadershipDepartment'),
            'hr_department' => $this->whenLoaded('hrDepartment'),
        ];
    }
}
