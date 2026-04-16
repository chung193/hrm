<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeaveRequestUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'leave_type' => ['sometimes', Rule::in(['annual', 'sick', 'unpaid', 'other'])],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
            'reason' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

