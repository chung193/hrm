<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface LeaveRequestServiceInterface extends BaseServiceInterface
{
    public function getLeaveRequests(): Collection;

    public function getAllLeaveRequests(): Collection;

    public function getFilteredLeaveRequests(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getLeaveRequestById(int $id): ?Model;

    public function createLeaveRequest(array $data): Model;

    public function updateLeaveRequest(int $id, array $data): Model;

    public function approveLeaveRequest(int $id): Model;

    public function rejectLeaveRequest(int $id, string $reason): Model;

    public function getMonthlyCalendarLeaveRequests(int $year, int $month): Collection;

    public function getLeaveBalance(?int $userId = null, ?string $month = null): array;

    public function deleteLeaveRequest(int $id): bool;

    public function deleteLeaveRequests(array $ids): int;

    public function getActiveLeaveRequests(): Collection;
}
