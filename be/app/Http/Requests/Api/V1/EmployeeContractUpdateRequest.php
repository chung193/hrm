<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeContractUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'contract_type_id' => ['sometimes', 'integer', 'exists:contract_types,id'],
            'contract_no' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('employee_contracts', 'contract_no')->ignore($this->route('employee_contract')),
            ],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'signed_date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'expired', 'terminated'])],
            'note' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

