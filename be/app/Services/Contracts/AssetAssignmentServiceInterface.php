<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface AssetAssignmentServiceInterface extends BaseServiceInterface
{
    public function getAssetAssignments(): Collection;

    public function getAllAssetAssignments(): Collection;

    public function getFilteredAssetAssignments(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getAssetAssignmentById(int $id): ?Model;

    public function createAssetAssignment(array $data): Model;

    public function updateAssetAssignment(int $id, array $data): Model;

    public function returnAssetAssignment(int $id, array $data): Model;

    public function requestRecall(int $id, array $data): Model;

    public function deleteAssetAssignment(int $id): bool;

    public function deleteAssetAssignments(array $ids): int;

    public function getActiveAssetAssignments(): Collection;
}
