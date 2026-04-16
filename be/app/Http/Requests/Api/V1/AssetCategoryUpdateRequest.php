<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssetCategoryUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = (int) $this->route('asset_category');

        return [
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'parent_id' => ['nullable', 'integer', 'exists:asset_categories,id', Rule::notIn([$categoryId])],
            'code' => ['required', 'string', 'max:50', Rule::unique('asset_categories', 'code')->ignore($categoryId)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'custom_field_schema' => ['nullable', 'array'],
            'custom_field_schema.*.key' => ['required_with:custom_field_schema', 'string', 'max:100'],
            'custom_field_schema.*.label' => ['nullable', 'string', 'max:255'],
            'custom_field_schema.*.type' => ['nullable', 'string', 'max:50'],
            'custom_field_schema.*.required' => ['nullable', 'boolean'],
            'custom_field_schema.*.options' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
