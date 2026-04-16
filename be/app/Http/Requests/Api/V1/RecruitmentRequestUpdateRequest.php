<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecruitmentRequestUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requested_position' => ['sometimes', 'string', 'max:255'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'reason' => ['sometimes', 'string'],
            'note' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', Rule::in(['pending', 'received', 'recruiting', 'interviewing', 'hired'])],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

