<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecruitmentRequestStatusUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['pending', 'received', 'recruiting', 'interviewing', 'hired'])],
            'hired_user_ids' => ['sometimes', 'array'],
            'hired_user_ids.*' => ['integer', 'exists:users,id'],
            'hired_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}

