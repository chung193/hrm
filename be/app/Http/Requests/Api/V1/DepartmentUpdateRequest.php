<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $currentDepartment = Department::query()->find($this->route('department'));
        $organizationId = (int) ($this->input('organization_id') ?? $currentDepartment?->organization_id);

        return [
            'organization_id' => ['sometimes', 'integer', 'exists:organizations,id'],
            'code' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('departments', 'code')
                    ->where(fn($query) => $query->where('organization_id', $organizationId))
                    ->ignore($this->route('department')),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
