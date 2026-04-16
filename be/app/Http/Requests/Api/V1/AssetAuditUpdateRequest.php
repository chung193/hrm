<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class AssetAuditUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'audited_at' => ['required', 'date'],
            'status' => ['nullable', 'in:planned,in_progress,completed'],
            'notes' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.asset_id' => ['required_with:items', 'integer', 'exists:assets,id'],
            'items.*.expected_location_status' => ['nullable', 'in:in_use,storage,broken,lost,maintenance,warranty,disposed'],
            'items.*.actual_location_status' => ['nullable', 'in:in_use,storage,broken,lost,maintenance,warranty,disposed'],
            'items.*.result_status' => ['nullable', 'in:matched,mismatch,missing,found'],
            'items.*.notes' => ['nullable', 'string'],
            'items.*.metadata' => ['nullable', 'array'],
        ];
    }
}
