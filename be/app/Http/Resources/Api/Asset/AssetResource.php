<?php

namespace App\Http\Resources\Api\Asset;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'category_id' => $this->category_id,
            'department_id' => $this->department_id,
            'current_user_id' => $this->current_user_id,
            'current_assignment_id' => $this->current_assignment_id,
            'asset_code' => $this->asset_code,
            'qr_code' => $this->qr_code,
            'qr_image' => $this->qr_image,
            'name' => $this->name,
            'description' => $this->description,
            'purchase_date' => $this->purchase_date,
            'purchase_price' => $this->purchase_price,
            'warranty_start_date' => $this->warranty_start_date,
            'warranty_end_date' => $this->warranty_end_date,
            'condition_status' => $this->condition_status,
            'location_status' => $this->location_status,
            'maintenance_status' => $this->maintenance_status,
            'disposal_status' => $this->disposal_status,
            'manufacturer' => $this->manufacturer,
            'brand' => $this->brand,
            'model_name' => $this->model_name,
            'serial_number' => $this->serial_number,
            'specifications' => $this->specifications ?? [],
            'custom_field_values' => $this->custom_field_values ?? [],
            'last_audited_at' => $this->last_audited_at,
            'is_active' => $this->is_active,
            'image_url' => $this->image_url,
            'image_thumb_url' => $this->image_thumb_url,
            'gallery_images' => $this->gallery_images,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'organization' => $this->whenLoaded('organization'),
            'category' => $this->whenLoaded('category'),
            'department' => $this->whenLoaded('department'),
            'current_user' => $this->whenLoaded('currentUser'),
            'current_assignment' => $this->whenLoaded('currentAssignment'),
            'assignments' => $this->whenLoaded('assignments'),
            'maintenances' => $this->whenLoaded('maintenances'),
        ];
    }
}
