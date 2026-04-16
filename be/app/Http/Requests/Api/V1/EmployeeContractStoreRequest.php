<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeContractStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'contract_type_id' => ['required', 'integer', 'exists:contract_types,id'],
            'contract_no' => ['nullable', 'string', 'max:100', 'unique:employee_contracts,contract_no'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'signed_date' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'expired', 'terminated'])],
            'note' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

