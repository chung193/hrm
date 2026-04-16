<?php

namespace App\Http\Requests\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserDetailUpdateRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($this->route('user')),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'employee_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                Rule::unique('user_details', 'employee_code')
                    ->ignore($this->route('user'), 'user_id'),
            ],
            'organization_id' => ['sometimes', 'nullable', 'integer', 'exists:organizations,id'],
            'department_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('departments', 'id')->where(function ($query) {
                    $organizationId = $this->currentOrganizationId();
                    if ($organizationId) {
                        $query->where('organization_id', $organizationId);
                    }
                }),
            ],
            'department_title_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('department_titles', 'id')->where(function ($query) {
                    $departmentId = $this->input('department_id');
                    if ($departmentId) {
                        $query->where('department_id', $departmentId);
                    }
                }),
            ],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'description' => ['sometimes', 'nullable', 'string'],
            'position' => ['sometimes', 'nullable', 'string', 'max:255'],
            'website' => ['sometimes', 'nullable', 'string', 'max:255'],
            'github' => ['sometimes', 'nullable', 'string', 'max:255'],
            'join_date' => ['sometimes', 'nullable', 'date'],
            'hired_at' => ['sometimes', 'nullable', 'date'],
            'birthday' => ['sometimes', 'nullable', 'date'],
        ];
    }

    private function currentOrganizationId(): ?int
    {
        $organizationId = $this->input('organization_id');
        if ($organizationId) {
            return (int) $organizationId;
        }

        $userId = $this->route('user');
        if (!$userId) {
            return null;
        }

        $user = User::query()->with('detail')->find($userId);
        return $user?->detail?->organization_id ? (int) $user->detail->organization_id : null;
    }
}
