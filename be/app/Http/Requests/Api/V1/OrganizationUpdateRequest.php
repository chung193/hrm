<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrganizationUpdateRequest extends FormRequest
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
                Rule::unique('organizations', 'code')->ignore($this->route('organization')),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

