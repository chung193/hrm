<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class AssetAssignmentReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'returned_at' => ['nullable', 'date'],
            'return_reason' => ['nullable', 'string', 'max:255'],
            'handover_notes' => ['nullable', 'string'],
            'location_status' => ['nullable', 'in:storage,broken,lost,maintenance,warranty,disposed'],
            'condition_status' => ['nullable', 'in:new,good,fair,damaged,broken,lost,disposed'],
        ];
    }
}
