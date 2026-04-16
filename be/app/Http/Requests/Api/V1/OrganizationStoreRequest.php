<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class OrganizationStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:organizations,code'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

