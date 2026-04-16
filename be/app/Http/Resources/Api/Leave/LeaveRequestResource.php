<?php

namespace App\Http\Resources\Api\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'request_no' => $this->request_no,
            'organization_id' => $this->organization_id,
            'user_id' => $this->user_id,
            'department_id' => $this->department_id,
            'department_title_id' => $this->department_title_id,
            'approver_user_id' => $this->approver_user_id,
            'leave_type' => $this->leave_type,
            'start_date' => optional($this->start_date)->toDateString(),
            'end_date' => optional($this->end_date)->toDateString(),
            'total_days' => (float) $this->total_days,
            'reason' => $this->reason,
            'rejection_reason' => $this->rejection_reason,
            'status' => $this->status,
            'approved_at' => optional($this->approved_at)?->toDateTimeString(),
            'rejected_at' => optional($this->rejected_at)?->toDateTimeString(),
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user'),
            'organization' => $this->whenLoaded('organization'),
            'department' => $this->whenLoaded('department'),
            'department_title' => $this->whenLoaded('departmentTitle'),
            'approver' => $this->whenLoaded('approver'),
        ];
    }
}
