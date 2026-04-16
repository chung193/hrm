<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentTitleStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('department_titles', 'code')->where(
                    fn($query) => $query->where('department_id', $this->input('department_id'))
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'can_request_recruitment' => ['sometimes', 'boolean'],
            'can_approve_leave' => ['sometimes', 'boolean'],
        ];
    }
}
