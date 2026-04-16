<?php

namespace App\Http\Resources\Api\AssetMaintenance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetMaintenanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'asset_id' => $this->asset_id,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'vendor_name' => $this->vendor_name,
            'scheduled_at' => $this->scheduled_at,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'cost' => $this->cost,
            'next_maintenance_at' => $this->next_maintenance_at,
            'notes' => $this->notes,
            'metadata' => $this->metadata ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'asset' => $this->whenLoaded('asset'),
        ];
    }
}
