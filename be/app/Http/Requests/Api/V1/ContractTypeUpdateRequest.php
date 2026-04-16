<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ContractTypeUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $organizationId = $this->resolveOrganizationId();

        return [
            'organization_id' => ['sometimes', 'integer', 'exists:organizations,id'],
            'code' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('contract_types', 'code')
                    ->ignore($this->route('contract_type'))
                    ->where(fn($query) => $query->where('organization_id', $organizationId)),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'duration_months' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:600'],
            'is_probation' => ['sometimes', 'boolean'],
            'is_indefinite' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function resolveOrganizationId(): int
    {
        $authUser = Auth::user()?->loadMissing('detail');
        $requestedOrganizationId = (int) $this->input('organization_id', 0);
        $userOrganizationId = (int) ($authUser?->detail?->organization_id ?? 0);

        if ($authUser?->isAdmin()) {
            if ($requestedOrganizationId > 0) {
                return $requestedOrganizationId;
            }

            throw ValidationException::withMessages([
                'organization_id' => 'Organization context is required.',
            ]);
        }

        if ($userOrganizationId > 0) {
            if ($requestedOrganizationId > 0 && $requestedOrganizationId !== $userOrganizationId) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot access another organization.',
                ]);
            }

            return $requestedOrganizationId > 0 ? $requestedOrganizationId : $userOrganizationId;
        }

        throw ValidationException::withMessages([
            'organization_id' => 'Organization context is required.',
        ]);
    }
}
