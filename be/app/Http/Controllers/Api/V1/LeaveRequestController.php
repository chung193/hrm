<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\LeaveRequestRejectRequest;
use App\Http\Requests\Api\V1\LeaveRequestStoreRequest;
use App\Http\Requests\Api\V1\LeaveRequestUpdateRequest;
use App\Http\Resources\Api\Leave\LeaveRequestResource;
use App\Models\PublicHoliday;
use App\Services\Contracts\LeaveRequestServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LeaveRequestController extends BaseApiController
{
    public function __construct(
        protected readonly LeaveRequestServiceInterface $leaveRequestService
    ) {}

    public function index(): JsonResponse
    {
        $items = $this->leaveRequestService->getFilteredLeaveRequests(request());
        return $this->successResponse(LeaveRequestResource::collection($items));
    }

    public function all(): JsonResponse
    {
        $items = $this->leaveRequestService->getAllLeaveRequests();
        return $this->successResponse(LeaveRequestResource::collection($items));
    }

    public function active(): JsonResponse
    {
        $items = $this->leaveRequestService->getActiveLeaveRequests();
        return $this->successResponse(LeaveRequestResource::collection($items));
    }

    public function show(int $id): JsonResponse
    {
        $item = $this->leaveRequestService->getLeaveRequestById($id);
        return $this->successResponse(new LeaveRequestResource($item));
    }

    public function store(LeaveRequestStoreRequest $request): JsonResponse
    {
        $item = $this->leaveRequestService->createLeaveRequest($request->validated());
        return $this->createdResponse(new LeaveRequestResource($item));
    }

    public function update(LeaveRequestUpdateRequest $request, int $id): JsonResponse
    {
        $item = $this->leaveRequestService->updateLeaveRequest($id, $request->validated());
        return $this->successResponse(new LeaveRequestResource($item));
    }

    public function approve(int $id): JsonResponse
    {
        $item = $this->leaveRequestService->approveLeaveRequest($id);
        return $this->successResponse(new LeaveRequestResource($item));
    }

    public function reject(LeaveRequestRejectRequest $request, int $id): JsonResponse
    {
        $item = $this->leaveRequestService->rejectLeaveRequest($id, $request->validated()['rejection_reason']);
        return $this->successResponse(new LeaveRequestResource($item));
    }

    public function calendar(Request $request): JsonResponse
    {
        $month = $request->query('month', now()->format('Y-m'));
        [$year, $monthValue] = array_map('intval', explode('-', $month));
        $start = Carbon::create($year, $monthValue, 1)->startOfMonth();
        $end = Carbon::create($year, $monthValue, 1)->endOfMonth();
        $items = $this->leaveRequestService->getMonthlyCalendarLeaveRequests($year, $monthValue);
        $organizationId = $this->resolveOrganizationIdFromAuth();

        $holidayQuery = PublicHoliday::query()
            ->where('is_active', true)
            ->whereBetween('holiday_date', [$start->toDateString(), $end->toDateString()]);

        if ($organizationId) {
            $holidayQuery->where(function ($query) use ($organizationId) {
                $query->whereNull('organization_id')
                    ->orWhere('organization_id', $organizationId);
            });
        } else {
            $holidayQuery->whereNull('organization_id');
        }

        $holidays = $holidayQuery
            ->orderBy('holiday_date')
            ->get()
            ->map(function ($holiday) {
                return [
                    'id' => (int) $holiday->id,
                    'organization_id' => $holiday->organization_id ? (int) $holiday->organization_id : null,
                    'name' => $holiday->name,
                    'holiday_date' => optional($holiday->holiday_date)->toDateString(),
                    'note' => $holiday->note,
                    'is_active' => (bool) $holiday->is_active,
                ];
            });

        return $this->successResponse([
            'leave_requests' => LeaveRequestResource::collection($items)->resolve(),
            'holidays' => $holidays,
        ]);
    }

    public function balance(Request $request): JsonResponse
    {
        $month = $request->query('month');
        $userId = $request->query('user_id');
        $balance = $this->leaveRequestService->getLeaveBalance(
            $userId !== null ? (int) $userId : null,
            $month ? (string) $month : null
        );

        return $this->successResponse($balance);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->leaveRequestService->deleteLeaveRequest($id);
        if ($deleted) {
            return $this->successResponse(['message' => 'Leave request deleted successfully']);
        }

        return $this->errorMessage('Error deleting leave request', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:leave_requests,id',
        ]);

        $count = $this->leaveRequestService->deleteLeaveRequests($validated['ids']);

        return $this->successResponse([
            'message' => "Deleted {$count} leave requests successfully",
        ]);
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
}
