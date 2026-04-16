<?php

namespace App\Http\Resources\Api\AssetCategory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'parent_id' => $this->parent_id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'custom_field_schema' => $this->custom_field_schema ?? [],
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'organization' => $this->whenLoaded('organization'),
            'parent' => $this->whenLoaded('parent'),
            'children' => $this->whenLoaded('children'),
        ];
    }
}
