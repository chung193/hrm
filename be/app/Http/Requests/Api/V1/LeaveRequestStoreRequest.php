<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeaveRequestStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'leave_type' => ['sometimes', Rule::in(['annual', 'sick', 'unpaid', 'other'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

