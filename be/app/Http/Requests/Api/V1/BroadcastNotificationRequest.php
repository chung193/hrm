<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BroadcastNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'audience_type' => ['required', Rule::in(['users', 'organization', 'system'])],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'kind' => ['nullable', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'action_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}
