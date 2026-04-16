<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface OrganizationServiceInterface extends BaseServiceInterface
{
    public function getOrganizations(): Collection;

    public function getAllOrganizations(): Collection;

    public function getFilteredOrganizations(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getOrganizationById(int $id): ?Model;

    public function createOrganization(array $data): Model;

    public function updateOrganization(int $id, array $data): Model;

    public function deleteOrganization(int $id): bool;

    public function deleteOrganizations(array $ids): int;

    public function getActiveOrganizations(): Collection;
}

