<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class AssetAssignmentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'assignment_type' => ['nullable', 'in:assignment,return,transfer,checkout'],
            'status' => ['nullable', 'in:assigned,returned,pending'],
            'assigned_at' => ['nullable', 'date'],
            'due_back_at' => ['nullable', 'date'],
            'returned_at' => ['nullable', 'date'],
            'return_reason' => ['nullable', 'string', 'max:255'],
            'handover_notes' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
