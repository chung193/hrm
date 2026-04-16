<?php

namespace App\Http\Requests\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeContractStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $organizationId = $this->resolveOrganizationId();

        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'contract_type_id' => [
                'required',
                'integer',
                Rule::exists('contract_types', 'id')->where(function ($query) use ($organizationId) {
                    if ($organizationId) {
                        $query->where('organization_id', $organizationId);
                    }
                }),
            ],
            'contract_no' => ['nullable', 'string', 'max:100', 'unique:employee_contracts,contract_no'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'signed_date' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'expired', 'terminated'])],
            'note' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function resolveOrganizationId(): ?int
    {
        $requestOrganizationId = $this->input('organization_id');
        if ($requestOrganizationId) {
            return (int) $requestOrganizationId;
        }

        $userId = $this->input('user_id');
        if (!$userId) {
            return null;
        }

        $user = User::query()->with('detail')->find($userId);
        return $user?->detail?->organization_id ? (int) $user->detail->organization_id : null;
    }
}
