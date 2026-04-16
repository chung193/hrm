<?php

namespace App\Http\Resources\Api\Recruitment;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecruitmentRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'request_no' => $this->request_no,
            'organization_id' => $this->organization_id,
            'requested_by_user_id' => $this->requested_by_user_id,
            'requesting_department_id' => $this->requesting_department_id,
            'requesting_department_title_id' => $this->requesting_department_title_id,
            'hr_department_id' => $this->hr_department_id,
            'requested_position' => $this->requested_position,
            'quantity' => $this->quantity,
            'reason' => $this->reason,
            'note' => $this->note,
            'status' => $this->status,
            'received_by_user_id' => $this->received_by_user_id,
            'received_at' => optional($this->received_at)?->toDateTimeString(),
            'status_updated_at' => optional($this->status_updated_at)?->toDateTimeString(),
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'organization' => $this->whenLoaded('organization'),
            'requested_by' => $this->whenLoaded('requestedBy'),
            'requesting_department' => $this->whenLoaded('requestingDepartment'),
            'requesting_department_title' => $this->whenLoaded('requestingDepartmentTitle'),
            'hr_department' => $this->whenLoaded('hrDepartment'),
            'received_by' => $this->whenLoaded('receivedBy'),
            'hires' => RecruitmentRequestHireResource::collection($this->whenLoaded('hires')),
        ];
    }
}
