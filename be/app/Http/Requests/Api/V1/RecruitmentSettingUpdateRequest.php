<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class RecruitmentSettingUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_id' => ['sometimes', 'integer', 'exists:organizations,id'],
            'leadership_department_id' => ['nullable', 'integer', 'exists:departments,id', 'different:hr_department_id'],
            'hr_department_id' => ['nullable', 'integer', 'exists:departments,id', 'different:leadership_department_id'],
        ];
    }
}
