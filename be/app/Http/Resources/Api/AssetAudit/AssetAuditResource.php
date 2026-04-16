<?php

namespace App\Http\Resources\Api\AssetAudit;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetAuditResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'department_id' => $this->department_id,
            'audited_by_user_id' => $this->audited_by_user_id,
            'audited_at' => $this->audited_at,
            'status' => $this->status,
            'notes' => $this->notes,
            'summary' => $this->summary ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'department' => $this->whenLoaded('department'),
            'audited_by' => $this->whenLoaded('auditedBy'),
            'items' => $this->whenLoaded('items'),
        ];
    }
}
