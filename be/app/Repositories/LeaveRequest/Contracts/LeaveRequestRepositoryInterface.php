<?php

namespace App\Repositories\LeaveRequest\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface LeaveRequestRepositoryInterface extends QueryableRepositoryInterface
{
    public function getLeaveRequests(): Collection;

    public function getActiveLeaveRequests(): Collection;

    public function bulkDelete(array $ids): int;
}

