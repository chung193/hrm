<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_id' => ['required', 'integer', 'exists:organizations,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departments', 'code')->where(
                    fn($query) => $query->where('organization_id', $this->input('organization_id'))
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

