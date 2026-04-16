<?php

namespace App\Http\Requests\Api\V1;

use App\Models\EmployeeContract;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeContractUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $organizationId = $this->resolveOrganizationId();

        return [
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'contract_type_id' => [
                'sometimes',
                'integer',
                Rule::exists('contract_types', 'id')->where(function ($query) use ($organizationId) {
                    if ($organizationId) {
                        $query->where('organization_id', $organizationId);
                    }
                }),
            ],
            'contract_no' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('employee_contracts', 'contract_no')->ignore($this->route('employee_contract')),
            ],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'signed_date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'expired', 'terminated'])],
            'note' => ['sometimes', 'nullable', 'string'],
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
        if ($userId) {
            $user = User::query()->with('detail')->find($userId);
            if ($user?->detail?->organization_id) {
                return (int) $user->detail->organization_id;
            }
        }

        $contractId = $this->route('employee_contract');
        if (!$contractId) {
            return null;
        }

        $contract = EmployeeContract::query()->with('user.detail')->find($contractId);
        return $contract?->user?->detail?->organization_id ? (int) $contract->user->detail->organization_id : null;
    }
}
