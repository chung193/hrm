<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class ContractTypeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:contract_types,code'],
            'name' => ['required', 'string', 'max:255'],
            'duration_months' => ['nullable', 'integer', 'min:1', 'max:600'],
            'is_probation' => ['sometimes', 'boolean'],
            'is_indefinite' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

