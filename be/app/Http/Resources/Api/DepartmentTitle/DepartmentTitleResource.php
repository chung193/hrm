<?php

namespace App\Http\Resources\Api\DepartmentTitle;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentTitleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'department_id' => $this->department_id,
            'code' => $this->code,
            'name' => $this->name,
            'is_active' => $this->is_active,
            'can_request_recruitment' => $this->can_request_recruitment,
            'can_approve_leave' => $this->can_approve_leave,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'department' => $this->whenLoaded('department'),
        ];
    }
}
