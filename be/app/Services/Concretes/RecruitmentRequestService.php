<?php

namespace App\Services\Concretes;

use App\Models\RecruitmentRequestHire;
use App\Repositories\RecruitmentRequest\Contracts\RecruitmentRequestRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\RecruitmentSettingServiceInterface;
use App\Services\Contracts\RecruitmentRequestServiceInterface;
use App\Services\Support\AppNotificationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecruitmentRequestService extends BaseService implements RecruitmentRequestServiceInterface
{
    private const STATUSES = [
        'pending' => 1,
        'received' => 2,
        'recruiting' => 3,
        'interviewing' => 4,
        'hired' => 5,
    ];

    public function __construct(
        protected RecruitmentRequestRepositoryInterface $recruitmentRequestRepository,
        protected RecruitmentSettingServiceInterface $recruitmentSettingService,
        protected AppNotificationService $notificationService
    ) {
        $this->setRepository($recruitmentRequestRepository);
    }

    public function getRecruitmentRequests(): Collection
    {
        return $this->getAllRecruitmentRequests();
    }

    public function getAllRecruitmentRequests(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    public function getFilteredRecruitmentRequests(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $perPage = request('per_page', $perPage);
        $organizationId = $this->resolveOrganizationIdFromAuth();

        $query = $this->recruitmentRequestRepository->query();
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        $items = $query->paginate($perPage, ['*']);
        $items->getCollection()->load([
            'organization',
            'requestedBy',
            'requestingDepartment',
            'requestingDepartmentTitle',
            'hrDepartment',
            'receivedBy',
            'hires.user',
        ]);

        return $items;
    }

    public function getRecruitmentRequestById(int $id): ?Model
    {
        try {
            $item = $this->recruitmentRequestRepository->query()
                ->with([
                    'organization',
                    'requestedBy',
                    'requestingDepartment',
                    'requestingDepartmentTitle',
                    'hrDepartment',
                    'receivedBy',
                    'hires.user',
                ])
                ->findOrFail($id);

            $this->ensureBelongsToCurrentOrganization($item);

            return $item;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Recruitment request not found');
        }
    }

    public function createRecruitmentRequest(array $data): Model
    {
        $actor = Auth::user();
        $actorDetail = $actor?->detail;

        if (!$actorDetail?->department_id || !$actorDetail?->department_title_id) {
            $missingFields = [];
            if (!$actorDetail?->department_id) {
                $missingFields[] = 'department';
            }
            if (!$actorDetail?->department_title_id) {
                $missingFields[] = 'department title';
            }

            throw ValidationException::withMessages([
                'user' => sprintf(
                    'Requester is missing %s. Please update the user profile before creating a recruitment request.',
                    implode(' and ', $missingFields)
                ),
            ]);
        }

        $departmentTitle = $actorDetail->departmentTitle;
        if (!$departmentTitle || !$departmentTitle->can_request_recruitment) {
            throw ValidationException::withMessages([
                'user' => 'Only department titles with recruitment request permission can create a request.',
            ]);
        }

        $organizationId = (int) ($actorDetail?->organization_id ?? 0);
        if (!$organizationId) {
            throw ValidationException::withMessages([
                'organization_id' => 'Requester must belong to an organization.',
            ]);
        }

        $settings = $this->recruitmentSettingService->getSettings($organizationId);
        if (!$settings->hr_department_id) {
            throw ValidationException::withMessages([
                'hr_department_id' => 'HR department is not configured in recruitment settings.',
            ]);
        }

        return DB::transaction(function () use ($data, $actor, $actorDetail, $settings, $organizationId) {
            $item = $this->repository->create([
                'request_no' => $this->generateRequestNo(),
                'organization_id' => $organizationId,
                'requested_by_user_id' => $actor->id,
                'requesting_department_id' => $actorDetail->department_id,
                'requesting_department_title_id' => $actorDetail->department_title_id,
                'hr_department_id' => $settings->hr_department_id,
                'requested_position' => $data['requested_position'],
                'quantity' => $data['quantity'],
                'reason' => $data['reason'],
                'note' => $data['note'] ?? null,
                'status' => 'pending',
                'status_updated_at' => now(),
                'is_active' => (bool) ($data['is_active'] ?? true),
            ]);

            return $item->load([
                'organization',
                'requestedBy',
                'requestingDepartment',
                'requestingDepartmentTitle',
                'hrDepartment',
                'receivedBy',
                'hires.user',
            ]);
        });
    }

    public function updateRecruitmentRequest(int $id, array $data): Model
    {
        try {
            $item = $this->recruitmentRequestRepository->findOrFail($id);
            $this->ensureBelongsToCurrentOrganization($item);
            $this->repository->update($id, $data);
            return $this->getRecruitmentRequestById($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Recruitment request not found');
        }
    }

    public function updateRecruitmentStatus(int $id, array $data): Model
    {
        $actor = Auth::user();
        $this->ensureActorIsHrDepartmentMember($actor?->id);

        return DB::transaction(function () use ($id, $data, $actor) {
            $item = $this->recruitmentRequestRepository->findOrFail($id);
            $this->ensureBelongsToCurrentOrganization($item);

            $currentStatus = $item->status;
            $nextStatus = $data['status'];

            if (self::STATUSES[$nextStatus] < self::STATUSES[$currentStatus]) {
                throw ValidationException::withMessages([
                    'status' => 'Status transition backward is not allowed.',
                ]);
            }

            $updateData = [
                'status' => $nextStatus,
                'status_updated_at' => now(),
            ];

            if ($nextStatus === 'received' && !$item->received_at) {
                $updateData['received_at'] = now();
                $updateData['received_by_user_id'] = $actor->id;
            }

            $item = $this->repository->update($id, $updateData);

            if (array_key_exists('hired_user_ids', $data)) {
                RecruitmentRequestHire::query()
                    ->where('recruitment_request_id', $id)
                    ->delete();

                foreach ($data['hired_user_ids'] as $userId) {
                    RecruitmentRequestHire::query()->create([
                        'recruitment_request_id' => $id,
                        'user_id' => $userId,
                        'hired_at' => $data['hired_at'] ?? now()->toDateString(),
                    ]);
                }
            }

            $requester = $item->requestedBy()->first();
            if ($requester) {
                $this->notificationService->notifyUser($requester, [
                    'kind' => 'recruitment_request',
                    'title' => 'Cap nhat yeu cau tuyen dung',
                    'message' => sprintf(
                        'Yeu cau %s cho vi tri %s da chuyen sang trang thai %s.',
                        $item->request_no,
                        $item->requested_position,
                        $nextStatus
                    ),
                    'action_url' => '/dashboard/recruitment-request',
                    'entity_type' => 'recruitment_request',
                    'entity_id' => $item->id,
                    'organization_id' => $item->organization_id,
                    'meta' => [
                        'status' => $nextStatus,
                    ],
                ]);
            }

            return $item->load([
                'organization',
                'requestedBy',
                'requestingDepartment',
                'requestingDepartmentTitle',
                'hrDepartment',
                'receivedBy',
                'hires.user',
            ]);
        });
    }

    public function markAsReceived(int $id): Model
    {
        $actor = Auth::user();
        $this->ensureActorIsHrDepartmentMember($actor?->id);

        return DB::transaction(function () use ($id, $actor) {
            $item = $this->recruitmentRequestRepository->findOrFail($id);
            $this->ensureBelongsToCurrentOrganization($item);

            if ($item->status === 'pending') {
                $item = $this->repository->update($id, [
                    'status' => 'received',
                    'received_by_user_id' => $actor->id,
                    'received_at' => now(),
                    'status_updated_at' => now(),
                ]);
            }

            $requester = $item->requestedBy()->first();
            if ($requester) {
                $this->notificationService->notifyUser($requester, [
                    'kind' => 'recruitment_request',
                    'title' => 'Yeu cau tuyen dung da duoc tiep nhan',
                    'message' => sprintf(
                        'Yeu cau %s cho vi tri %s da duoc phong HR tiep nhan.',
                        $item->request_no,
                        $item->requested_position
                    ),
                    'action_url' => '/dashboard/recruitment-request',
                    'entity_type' => 'recruitment_request',
                    'entity_id' => $item->id,
                    'organization_id' => $item->organization_id,
                    'meta' => [
                        'status' => 'received',
                    ],
                ]);
            }

            return $item->load([
                'organization',
                'requestedBy',
                'requestingDepartment',
                'requestingDepartmentTitle',
                'hrDepartment',
                'receivedBy',
                'hires.user',
            ]);
        });
    }

    public function deleteRecruitmentRequest(int $id): bool
    {
        try {
            $item = $this->recruitmentRequestRepository->findOrFail($id);
            $this->ensureBelongsToCurrentOrganization($item);
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Recruitment request not found');
        }
    }

    public function deleteRecruitmentRequests(array $ids): int
    {
        $items = $this->recruitmentRequestRepository->query()->whereIn('id', $ids)->get();
        foreach ($items as $item) {
            $this->ensureBelongsToCurrentOrganization($item);
        }

        $count = $this->recruitmentRequestRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Recruitment requests not found');
        }

        return $count;
    }

    public function getActiveRecruitmentRequests(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->recruitmentRequestRepository->query()->where('is_active', true);
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    private function ensureActorIsHrDepartmentMember(?int $userId): void
    {
        if (!$userId) {
            throw ValidationException::withMessages(['user' => 'Unauthorized user.']);
        }

        $organizationId = $this->resolveOrganizationIdFromAuth();
        if (!$organizationId) {
            throw ValidationException::withMessages([
                'organization_id' => 'Organization context is required for HR recruitment processing.',
            ]);
        }

        $settings = $this->recruitmentSettingService->getSettings($organizationId);
        if (!$settings->hr_department_id) {
            throw ValidationException::withMessages([
                'hr_department_id' => 'HR department is not configured in recruitment settings.',
            ]);
        }

        $detail = Auth::user()?->detail;
        if (!$detail || (int) $detail->department_id !== (int) $settings->hr_department_id) {
            throw ValidationException::withMessages([
                'department' => 'Only HR department users can process recruitment requests.',
            ]);
        }
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

    private function ensureBelongsToCurrentOrganization(Model $item): void
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if (!$organizationId) {
            return;
        }

        if ((int) $item->organization_id !== $organizationId) {
            throw ValidationException::withMessages([
                'organization_id' => 'This recruitment request does not belong to your organization.',
            ]);
        }
    }

    private function generateRequestNo(): string
    {
        $date = now()->format('Ymd');
        $prefix = "RR-{$date}-";
        $last = $this->recruitmentRequestRepository->query()
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
