<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface RecruitmentRequestServiceInterface extends BaseServiceInterface
{
    public function getRecruitmentRequests(): Collection;

    public function getAllRecruitmentRequests(): Collection;

    public function getFilteredRecruitmentRequests(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getRecruitmentRequestById(int $id): ?Model;

    public function createRecruitmentRequest(array $data): Model;

    public function updateRecruitmentRequest(int $id, array $data): Model;

    public function updateRecruitmentStatus(int $id, array $data): Model;

    public function markAsReceived(int $id): Model;

    public function deleteRecruitmentRequest(int $id): bool;

    public function deleteRecruitmentRequests(array $ids): int;

    public function getActiveRecruitmentRequests(): Collection;
}

