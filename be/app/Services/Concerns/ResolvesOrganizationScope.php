<?php

namespace App\Services\Concerns;

use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

trait ResolvesOrganizationScope
{
    protected function resolveOrganizationIdFromAuth(bool $allowAdminAll = true): ?int
    {
        $authUser = Auth::user()?->loadMissing('detail');
        $requestedOrganizationId = (int) request('organization_id', 0);
        $userOrganizationId = (int) ($authUser?->detail?->organization_id ?? 0);

        if ($userOrganizationId > 0) {
            if ($requestedOrganizationId > 0 && $requestedOrganizationId !== $userOrganizationId && !$authUser?->isAdmin()) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot access another organization.',
                ]);
            }

            return $requestedOrganizationId > 0 ? $requestedOrganizationId : $userOrganizationId;
        }

        if ($requestedOrganizationId > 0 && $authUser?->isAdmin()) {
            return $requestedOrganizationId;
        }

        if ($allowAdminAll && $authUser?->isAdmin()) {
            return null;
        }

        return null;
    }
}
