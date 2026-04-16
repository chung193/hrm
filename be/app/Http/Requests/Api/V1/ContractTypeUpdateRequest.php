<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContractTypeUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('contract_types', 'code')->ignore($this->route('contract_type')),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'duration_months' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:600'],
            'is_probation' => ['sometimes', 'boolean'],
            'is_indefinite' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

