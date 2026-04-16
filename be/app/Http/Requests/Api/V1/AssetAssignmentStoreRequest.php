<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class AssetAssignmentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'asset_id' => ['required', 'integer', 'exists:assets,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'assignment_type' => ['nullable', 'in:assignment,return,transfer,checkout'],
            'status' => ['nullable', 'in:assigned,returned,pending'],
            'assigned_at' => ['required', 'date'],
            'due_back_at' => ['nullable', 'date', 'after_or_equal:assigned_at'],
            'returned_at' => ['nullable', 'date', 'after_or_equal:assigned_at'],
            'return_reason' => ['nullable', 'string', 'max:255'],
            'handover_notes' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
