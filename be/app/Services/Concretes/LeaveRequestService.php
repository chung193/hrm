<?php

namespace App\Services\Concretes;

use App\Models\EmployeeContract;
use App\Models\User;
use App\Repositories\LeaveRequest\Contracts\LeaveRequestRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\LeaveRequestServiceInterface;
use App\Services\Contracts\RecruitmentSettingServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaveRequestService extends BaseService implements LeaveRequestServiceInterface
{
    public function __construct(
        protected LeaveRequestRepositoryInterface $leaveRequestRepository,
        protected RecruitmentSettingServiceInterface $recruitmentSettingService
    ) {
        $this->setRepository($leaveRequestRepository);
    }

    public function getLeaveRequests(): Collection
    {
        return $this->getAllLeaveRequests();
    }

    public function getAllLeaveRequests(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    public function getFilteredLeaveRequests(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $authUser = Auth::user();
        $authDetail = $authUser?->detail;
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $isHr = $this->isUserInHrDepartment($authDetail?->department_id, $organizationId);
        $isApprover = (bool) ($authDetail?->departmentTitle?->can_approve_leave);

        $query = $this->leaveRequestRepository
            ->query()
            ->with(['organization', 'user', 'department', 'departmentTitle', 'approver']);

        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        if (!$isHr) {
            $query->where(function ($q) use ($authUser, $authDetail, $isApprover) {
                $q->where('user_id', $authUser->id);

                if ($isApprover && $authDetail?->department_id) {
                    $q->orWhere('department_id', $authDetail->department_id);
                }
            });
        }

        $month = request('month');
        if ($month) {
            [$year, $monthValue] = array_map('intval', explode('-', $month));
            $start = Carbon::create($year, $monthValue, 1)->startOfMonth();
            $end = Carbon::create($year, $monthValue, 1)->endOfMonth();
            $query->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhereBetween('end_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhere(function ($inner) use ($start, $end) {
                        $inner->where('start_date', '<=', $start->toDateString())
                            ->where('end_date', '>=', $end->toDateString());
                    });
            });
        }

        $perPage = request('per_page', $perPage);
        $keyword = request('keyword');
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->orWhere('request_no', 'like', "%{$keyword}%")
                    ->orWhere('reason', 'like', "%{$keyword}%")
                    ->orWhere('leave_type', 'like', "%{$keyword}%");
            });
        }

        return $query->paginate($perPage, ['*']);
    }

    public function getLeaveRequestById(int $id): ?Model
    {
        try {
            $item = $this->leaveRequestRepository
                ->query()
                ->with(['organization', 'user', 'department', 'departmentTitle', 'approver'])
                ->findOrFail($id);

            $this->ensureCanViewLeaveRequest($item);

            return $item;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Leave request not found');
        }
    }

    public function createLeaveRequest(array $data): Model
    {
        $actor = Auth::user();
        $detail = $actor?->detail;
        if (!$detail?->department_id || !$detail?->department_title_id) {
            throw ValidationException::withMessages([
                'user' => 'Requester must have department and department title information.',
            ]);
        }
        $organizationId = (int) ($detail?->organization_id ?? 0);
        if (!$organizationId) {
            throw ValidationException::withMessages([
                'organization_id' => 'Requester must belong to an organization.',
            ]);
        }

        $startDate = Carbon::parse($data['start_date']);
        $endDate = Carbon::parse($data['end_date']);
        if ($endDate->lt($startDate)) {
            throw ValidationException::withMessages([
                'end_date' => 'End date must be greater than or equal to start date.',
            ]);
        }

        return DB::transaction(function () use ($data, $actor, $detail, $startDate, $endDate, $organizationId) {
            $totalDays = (float) $startDate->diffInDays($endDate) + 1;

            $item = $this->repository->create([
                'request_no' => $this->generateRequestNo(),
                'organization_id' => $organizationId,
                'user_id' => $actor->id,
                'department_id' => $detail->department_id,
                'department_title_id' => $detail->department_title_id,
                'leave_type' => $data['leave_type'] ?? 'annual',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'total_days' => $totalDays,
                'reason' => $data['reason'],
                'status' => 'pending',
                'is_active' => (bool) ($data['is_active'] ?? true),
            ]);

            return $item->load(['organization', 'user', 'department', 'departmentTitle', 'approver']);
        });
    }

    public function updateLeaveRequest(int $id, array $data): Model
    {
        $item = $this->leaveRequestRepository->findOrFail($id);
        $this->ensureCanEditLeaveRequest($item);

        if (isset($data['start_date']) || isset($data['end_date'])) {
            $startDate = Carbon::parse($data['start_date'] ?? $item->start_date);
            $endDate = Carbon::parse($data['end_date'] ?? $item->end_date);
            if ($endDate->lt($startDate)) {
                throw ValidationException::withMessages([
                    'end_date' => 'End date must be greater than or equal to start date.',
                ]);
            }
            $data['total_days'] = (float) $startDate->diffInDays($endDate) + 1;
        }

        $this->repository->update($id, $data);
        return $this->getLeaveRequestById($id);
    }

    public function approveLeaveRequest(int $id): Model
    {
        $item = $this->leaveRequestRepository->findOrFail($id);
        $this->ensureCanApproveLeaveRequest($item);

        if ($item->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending requests can be approved.']);
        }

        $actor = Auth::user();
        $this->repository->update($id, [
            'status' => 'approved',
            'approver_user_id' => $actor->id,
            'approved_at' => now(),
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        return $this->getLeaveRequestById($id);
    }

    public function rejectLeaveRequest(int $id, string $reason): Model
    {
        $item = $this->leaveRequestRepository->findOrFail($id);
        $this->ensureCanApproveLeaveRequest($item);

        if ($item->status !== 'pending') {
            throw ValidationException::withMessages(['status' => 'Only pending requests can be rejected.']);
        }

        $actor = Auth::user();
        $this->repository->update($id, [
            'status' => 'rejected',
            'approver_user_id' => $actor->id,
            'rejected_at' => now(),
            'approved_at' => null,
            'rejection_reason' => $reason,
        ]);

        return $this->getLeaveRequestById($id);
    }

    public function getMonthlyCalendarLeaveRequests(int $year, int $month): Collection
    {
        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = Carbon::create($year, $month, 1)->endOfMonth();

        $authUser = Auth::user();
        $authDetail = $authUser?->detail;
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $isHr = $this->isUserInHrDepartment($authDetail?->department_id, $organizationId);
        $isApprover = (bool) ($authDetail?->departmentTitle?->can_approve_leave);

        $query = $this->leaveRequestRepository
            ->query()
            ->with(['organization', 'user', 'department'])
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhereBetween('end_date', [$start->toDateString(), $end->toDateString()])
                    ->orWhere(function ($inner) use ($start, $end) {
                        $inner->where('start_date', '<=', $start->toDateString())
                            ->where('end_date', '>=', $end->toDateString());
                    });
            });

        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        if (!$isHr) {
            $query->where(function ($q) use ($authUser, $authDetail, $isApprover) {
                $q->where('user_id', $authUser->id);
                if ($isApprover && $authDetail?->department_id) {
                    $q->orWhere('department_id', $authDetail->department_id);
                }
            });
        }

        return $query->get();
    }

    public function getLeaveBalance(?int $userId = null, ?string $month = null): array
    {
        $targetUser = $this->resolveBalanceTargetUser($userId);
        $asOfDate = $this->resolveAsOfDate($month);

        return $this->calculateLeaveBalance($targetUser, $asOfDate);
    }

    public function deleteLeaveRequest(int $id): bool
    {
        $item = $this->leaveRequestRepository->findOrFail($id);
        $this->ensureCanEditLeaveRequest($item);

        $this->repository->delete($id);
        return true;
    }

    public function deleteLeaveRequests(array $ids): int
    {
        $items = $this->leaveRequestRepository->query()->whereIn('id', $ids)->get();
        foreach ($items as $item) {
            $this->ensureCanEditLeaveRequest($item);
        }

        $count = $this->leaveRequestRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Leave requests not found');
        }

        return $count;
    }

    public function getActiveLeaveRequests(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->leaveRequestRepository->query()->where('is_active', true);
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    private function ensureCanViewLeaveRequest(Model $item): void
    {
        $authUser = Auth::user();
        $authDetail = $authUser?->detail;
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId && (int) $item->organization_id !== $organizationId) {
            throw ValidationException::withMessages([
                'organization_id' => 'You do not have permission to view this leave request.',
            ]);
        }

        if ($this->isUserInHrDepartment($authDetail?->department_id, $organizationId)) {
            return;
        }

        if ((int) $item->user_id === (int) $authUser->id) {
            return;
        }

        $isApprover = (bool) ($authDetail?->departmentTitle?->can_approve_leave);
        if ($isApprover && (int) $item->department_id === (int) $authDetail?->department_id) {
            return;
        }

        throw ValidationException::withMessages([
            'permission' => 'You do not have permission to view this leave request.',
        ]);
    }

    private function ensureCanEditLeaveRequest(Model $item): void
    {
        $authUser = Auth::user();
        if ((int) $item->user_id !== (int) $authUser->id) {
            throw ValidationException::withMessages([
                'permission' => 'Only requester can edit this leave request.',
            ]);
        }

        if ($item->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => 'Only pending requests can be edited or deleted.',
            ]);
        }
    }

    private function ensureCanApproveLeaveRequest(Model $item): void
    {
        $authUser = Auth::user();
        $authDetail = $authUser?->detail;
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId && (int) $item->organization_id !== $organizationId) {
            throw ValidationException::withMessages([
                'organization_id' => 'You do not have permission to approve this leave request.',
            ]);
        }

        $isApprover = (bool) ($authDetail?->departmentTitle?->can_approve_leave);

        if (!$isApprover || (int) $authDetail?->department_id !== (int) $item->department_id) {
            throw ValidationException::withMessages([
                'permission' => 'Only manager/deputy in the same department can approve/reject this leave request.',
            ]);
        }
    }

    private function isUserInHrDepartment(?int $departmentId, ?int $organizationId = null): bool
    {
        if (!$departmentId) {
            return false;
        }

        if (!$organizationId) {
            return false;
        }

        $settings = $this->recruitmentSettingService->getSettings($organizationId);
        return (int) $settings->hr_department_id === (int) $departmentId;
    }

    private function resolveBalanceTargetUser(?int $userId): User
    {
        $authUser = Auth::user()->loadMissing('detail.departmentTitle');
        $authDetail = $authUser?->detail;
        $targetUserId = $userId ?: (int) $authUser->id;

        $targetUser = User::query()
            ->with(['detail.departmentTitle'])
            ->findOrFail($targetUserId);

        if ((int) $targetUser->id === (int) $authUser->id) {
            return $targetUser;
        }

        $organizationId = $this->resolveOrganizationIdFromAuth();
        if (
            $organizationId
            && (int) ($targetUser->detail?->organization_id ?? 0) !== $organizationId
            && !$authUser->isAdmin()
        ) {
            throw ValidationException::withMessages([
                'organization_id' => 'You do not have permission to view leave balance across organizations.',
            ]);
        }

        if ($authUser->isAdmin() || $this->isUserInHrDepartment($authDetail?->department_id, $organizationId)) {
            return $targetUser;
        }

        $canApproveLeave = (bool) ($authDetail?->departmentTitle?->can_approve_leave);
        if (
            $canApproveLeave
            && (int) $authDetail?->department_id > 0
            && (int) $authDetail?->department_id === (int) $targetUser->detail?->department_id
        ) {
            return $targetUser;
        }

        throw ValidationException::withMessages([
            'permission' => 'You do not have permission to view this leave balance.',
        ]);
    }

    private function resolveAsOfDate(?string $month): Carbon
    {
        if (!$month) {
            return now()->toMutable();
        }

        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            throw ValidationException::withMessages([
                'month' => 'Month must be in YYYY-MM format.',
            ]);
        }

        [$year, $monthValue] = array_map('intval', explode('-', $month));
        return Carbon::create($year, $monthValue, 1)->endOfMonth();
    }

    private function calculateLeaveBalance(User $user, Carbon $asOfDate): array
    {
        $currentYear = (int) $asOfDate->year;
        $previousYear = $currentYear - 1;
        $q1Deadline = Carbon::create($currentYear, 3, 31)->endOfDay();

        $currentYearStart = Carbon::create($currentYear, 1, 1)->startOfDay();
        $previousYearStart = Carbon::create($previousYear, 1, 1)->startOfDay();
        $previousYearEnd = Carbon::create($previousYear, 12, 31)->endOfDay();

        $accruedPreviousYear = $this->calculateAccruedDaysForYear($user->id, $previousYear);
        $usedPreviousYear = $this->calculateApprovedAnnualLeaveDaysInRange($user->id, $previousYearStart, $previousYearEnd);
        $carryFromPreviousYear = max($accruedPreviousYear - $usedPreviousYear, 0);

        $accruedCurrentYear = $this->calculateAccruedDaysForYear($user->id, $currentYear, $asOfDate);
        $usedCurrentYear = $this->calculateApprovedAnnualLeaveDaysInRange($user->id, $currentYearStart, $asOfDate);
        $usedCurrentYearInQ1 = $this->calculateApprovedAnnualLeaveDaysInRange(
            $user->id,
            $currentYearStart,
            $asOfDate->copy()->min($q1Deadline)
        );

        $usedFromPreviousCarry = min($carryFromPreviousYear, $usedCurrentYearInQ1);
        $remainingPreviousCarry = max($carryFromPreviousYear - $usedFromPreviousCarry, 0);
        $expiredPreviousCarry = $asOfDate->gt($q1Deadline) ? $remainingPreviousCarry : 0;
        $availablePreviousCarry = $asOfDate->lte($q1Deadline) ? $remainingPreviousCarry : 0;

        $usedFromCurrentYear = max($usedCurrentYear - $usedFromPreviousCarry, 0);
        $remainingCurrentYear = max($accruedCurrentYear - $usedFromCurrentYear, 0);

        return [
            'user_id' => (int) $user->id,
            'as_of_date' => $asOfDate->toDateString(),
            'month' => $asOfDate->format('Y-m'),
            'monthly_accrual_days' => 1,
            'accrued_current_year' => (float) round($accruedCurrentYear, 2),
            'used_current_year' => (float) round($usedCurrentYear, 2),
            'remaining_current_year' => (float) round($remainingCurrentYear, 2),
            'carry_from_previous_year' => (float) round($carryFromPreviousYear, 2),
            'available_previous_year' => (float) round($availablePreviousCarry, 2),
            'expired_previous_year' => (float) round($expiredPreviousCarry, 2),
            'used_from_previous_year' => (float) round($usedFromPreviousCarry, 2),
            'used_from_current_year' => (float) round($usedFromCurrentYear, 2),
            'available_total' => (float) round($remainingCurrentYear + $availablePreviousCarry, 2),
        ];
    }

    private function calculateAccruedDaysForYear(int $userId, int $year, ?Carbon $asOfDate = null): float
    {
        $yearStart = Carbon::create($year, 1, 1)->startOfMonth();
        $yearEnd = Carbon::create($year, 12, 1)->endOfMonth();

        if ($asOfDate && (int) $asOfDate->year === $year) {
            $yearEnd = $asOfDate->copy()->endOfMonth()->min($yearEnd);
        }

        if ($yearEnd->lt($yearStart)) {
            return 0;
        }

        $contracts = EmployeeContract::query()
            ->with('contractType:id,is_probation,duration_months')
            ->where('user_id', $userId)
            ->where('status', '!=', 'draft')
            ->whereDate('start_date', '<=', $yearEnd->toDateString())
            ->where(function ($query) use ($yearStart) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $yearStart->toDateString());
            })
            ->get();

        if ($contracts->isEmpty()) {
            return 0;
        }

        $officialContracts = $contracts->filter(fn ($contract) => !(bool) $contract->contractType?->is_probation);
        $accrualMonths = [];

        foreach ($officialContracts as $contract) {
            $months = $this->extractCoveredMonths($contract->start_date, $contract->end_date, $yearStart, $yearEnd);
            foreach ($months as $monthKey) {
                $accrualMonths[$monthKey] = true;
            }
        }

        $probationContracts = $contracts->filter(fn ($contract) => (bool) $contract->contractType?->is_probation);
        foreach ($probationContracts as $contract) {
            if (!$this->isEligibleProbationContract($contract, $officialContracts)) {
                continue;
            }

            $months = $this->extractCoveredMonths($contract->start_date, $contract->end_date, $yearStart, $yearEnd);
            foreach ($months as $monthKey) {
                $accrualMonths[$monthKey] = true;
            }
        }

        return (float) count($accrualMonths);
    }

    private function extractCoveredMonths($startDate, $endDate, Carbon $windowStart, Carbon $windowEnd): array
    {
        if (!$startDate) {
            return [];
        }

        $start = Carbon::parse($startDate)->startOfMonth()->max($windowStart->copy()->startOfMonth());
        $end = $endDate
            ? Carbon::parse($endDate)->endOfMonth()->min($windowEnd->copy()->endOfMonth())
            : $windowEnd->copy()->endOfMonth();

        if ($end->lt($start)) {
            return [];
        }

        $cursor = $start->copy()->startOfMonth();
        $endMonth = $end->copy()->startOfMonth();
        $months = [];

        while ($cursor->lte($endMonth)) {
            $months[] = $cursor->format('Y-m');
            $cursor->addMonthNoOverflow();
        }

        return $months;
    }

    private function isEligibleProbationContract(Model $probationContract, Collection $officialContracts): bool
    {
        if ($officialContracts->isEmpty() || !$probationContract->start_date) {
            return false;
        }

        $probationStart = Carbon::parse($probationContract->start_date)->startOfDay();
        $probationEnd = $probationContract->end_date
            ? Carbon::parse($probationContract->end_date)->endOfDay()
            : $probationStart->copy()
                ->addMonthsNoOverflow((int) ($probationContract->contractType?->duration_months ?: 2))
                ->subDay()
                ->endOfDay();

        return $officialContracts->contains(function ($contract) use ($probationStart, $probationEnd) {
            if (!$contract->start_date) {
                return false;
            }

            $officialStart = Carbon::parse($contract->start_date)->startOfDay();
            return $officialStart->gte($probationStart)
                && $officialStart->toDateString() >= $probationEnd->toDateString();
        });
    }

    private function calculateApprovedAnnualLeaveDaysInRange(int $userId, Carbon $from, Carbon $to): float
    {
        if ($to->lt($from)) {
            return 0;
        }

        $requests = $this->leaveRequestRepository
            ->query()
            ->where('user_id', $userId)
            ->where('leave_type', 'annual')
            ->where('status', 'approved')
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('start_date', [$from->toDateString(), $to->toDateString()])
                    ->orWhereBetween('end_date', [$from->toDateString(), $to->toDateString()])
                    ->orWhere(function ($inner) use ($from, $to) {
                        $inner->where('start_date', '<=', $from->toDateString())
                            ->where('end_date', '>=', $to->toDateString());
                    });
            })
            ->get(['start_date', 'end_date']);

        $total = 0.0;
        foreach ($requests as $request) {
            $requestStart = Carbon::parse($request->start_date)->startOfDay();
            $requestEnd = Carbon::parse($request->end_date)->endOfDay();
            $overlapStart = $requestStart->max($from->copy()->startOfDay());
            $overlapEnd = $requestEnd->min($to->copy()->endOfDay());

            if ($overlapEnd->gte($overlapStart)) {
                $total += ((float) $overlapStart->diffInDays($overlapEnd)) + 1;
            }
        }

        return $total;
    }

    private function resolveOrganizationIdFromAuth(): ?int
    {
        $authUser = Auth::user()?->loadMissing('detail');
        if (!$authUser) {
            return null;
        }

        $requestedOrganizationId = (int) request('organization_id', 0);
        $userOrganizationId = (int) ($authUser->detail?->organization_id ?? 0);

        if ($userOrganizationId > 0) {
            if ($requestedOrganizationId > 0 && $requestedOrganizationId !== $userOrganizationId && !$authUser->isAdmin()) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot access another organization.',
                ]);
            }

            return $requestedOrganizationId > 0 ? $requestedOrganizationId : $userOrganizationId;
        }

        if ($requestedOrganizationId > 0 && $authUser->isAdmin()) {
            return $requestedOrganizationId;
        }

        return null;
    }

    private function generateRequestNo(): string
    {
        $date = now()->format('Ymd');
        $prefix = "LR-{$date}-";
        $last = $this->leaveRequestRepository->query()
            ->where('request_no', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;
        if ($last?->request_no) {
            $lastSeq = (int) substr($last->request_no, -4);
            $nextNumber = $lastSeq + 1;
        }

        return $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
