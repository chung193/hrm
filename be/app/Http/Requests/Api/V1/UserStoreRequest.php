<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'is_active' => ['sometimes', 'boolean'],
            'employee_code' => ['nullable', 'string', 'max:50', 'unique:user_details,employee_code'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'department_id' => [
                'nullable',
                'integer',
                Rule::exists('departments', 'id')->where(function ($query) {
                    $organizationId = $this->input('organization_id');
                    if ($organizationId) {
                        $query->where('organization_id', $organizationId);
                    }
                }),
            ],
            'department_title_id' => [
                'nullable',
                'integer',
                Rule::exists('department_titles', 'id')->where(function ($query) {
                    $departmentId = $this->input('department_id');
                    if ($departmentId) {
                        $query->where('department_id', $departmentId);
                    }
                }),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'position' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'github' => ['nullable', 'string', 'max:255'],
            'join_date' => ['nullable', 'date'],
            'hired_at' => ['nullable', 'date'],
            'birthday' => ['nullable', 'date'],
        ];
    }
}
