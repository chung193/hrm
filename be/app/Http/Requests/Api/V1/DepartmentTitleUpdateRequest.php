<?php

namespace App\Http\Requests\Api\V1;

use App\Models\DepartmentTitle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentTitleUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $currentTitle = DepartmentTitle::query()->find($this->route('department_title'));
        $departmentId = (int) ($this->input('department_id') ?? $currentTitle?->department_id);

        return [
            'department_id' => ['sometimes', 'integer', 'exists:departments,id'],
            'code' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('department_titles', 'code')
                    ->where(fn($query) => $query->where('department_id', $departmentId))
                    ->ignore($this->route('department_title')),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'can_request_recruitment' => ['sometimes', 'boolean'],
            'can_approve_leave' => ['sometimes', 'boolean'],
        ];
    }
}
