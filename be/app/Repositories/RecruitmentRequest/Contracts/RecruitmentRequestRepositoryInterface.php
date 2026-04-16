<?php

namespace App\Repositories\RecruitmentRequest\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface RecruitmentRequestRepositoryInterface extends QueryableRepositoryInterface
{
    public function getRecruitmentRequests(): Collection;

    public function getActiveRecruitmentRequests(): Collection;

    public function bulkDelete(array $ids): int;
}

