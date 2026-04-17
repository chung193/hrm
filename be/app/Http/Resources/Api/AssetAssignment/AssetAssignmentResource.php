<?php

namespace App\Http\Resources\Api\AssetAssignment;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'asset_id' => $this->asset_id,
            'user_id' => $this->user_id,
            'department_id' => $this->department_id,
            'assigned_by_user_id' => $this->assigned_by_user_id,
            'assignment_type' => $this->assignment_type,
            'status' => $this->status,
            'assigned_at' => $this->assigned_at,
            'due_back_at' => $this->due_back_at,
            'returned_at' => $this->returned_at,
            'recall_requested_at' => $this->recall_requested_at,
            'recall_requested_by_user_id' => $this->recall_requested_by_user_id,
            'recall_note' => $this->recall_note,
            'return_reason' => $this->return_reason,
            'handover_notes' => $this->handover_notes,
            'metadata' => $this->metadata ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'asset' => $this->whenLoaded('asset'),
            'user' => $this->whenLoaded('user'),
            'department' => $this->whenLoaded('department'),
            'assigned_by' => $this->whenLoaded('assignedBy'),
            'recall_requested_by' => $this->whenLoaded('recallRequestedBy'),
        ];
    }
}
