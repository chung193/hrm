<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssetUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $assetId = (int) $this->route('asset');

        return [
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'category_id' => ['nullable', 'integer', 'exists:asset_categories,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'current_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'asset_code' => ['required', 'string', 'max:100', Rule::unique('assets', 'asset_code')->ignore($assetId)],
            'qr_code' => ['nullable', 'string', 'max:150', Rule::unique('assets', 'qr_code')->ignore($assetId)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'warranty_start_date' => ['nullable', 'date'],
            'warranty_end_date' => ['nullable', 'date', 'after_or_equal:warranty_start_date'],
            'condition_status' => ['nullable', 'in:new,good,fair,damaged,broken,lost,disposed'],
            'location_status' => ['nullable', 'in:in_use,storage,broken,lost,maintenance,warranty,disposed'],
            'maintenance_status' => ['nullable', 'in:normal,scheduled,in_progress,completed'],
            'disposal_status' => ['nullable', 'in:active,disposal_pending,disposed'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model_name' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'specifications' => ['nullable', 'array'],
            'custom_field_values' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'file', 'image', 'max:10240'],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'image', 'max:10240'],
        ];
    }
}
