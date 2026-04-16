<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class RecruitmentRequestStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requested_position' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'string'],
            'note' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

