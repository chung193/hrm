<?php

namespace App\Services\Concretes;

use App\Models\Department;
use App\Repositories\User\Contracts\UserRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserService extends BaseService implements UserServiceInterface
{
    private const DETAIL_KEYS = [
        'employee_code',
        'organization_id',
        'department_id',
        'department_title_id',
        'phone',
        'address',
        'city',
        'description',
        'position',
        'website',
        'github',
        'join_date',
        'hired_at',
        'birthday',
    ];

    /**
     * UserService constructor.
     */
    public function __construct(protected UserRepositoryInterface $userRepository)
    {
        $this->setRepository($userRepository);
    }

    /**
     * Get all users
     */
    public function getUsers(): Collection
    {
        return $this->repository->getFiltered();
    }

    /**
     * Get all users
     */
    public function getAllUsers(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId));
        }

        return $query->get();
    }

    /**
     * Get filtered users with pagination
     */
    public function getFilteredUsers(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $perPage = request('per_page', $perPage);
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId));
        }

        $users = $query->paginate($perPage);

        $users->getCollection()->load([
            'roles',
            'detail.organization',
            'detail.department',
            'detail.departmentTitle',
            'media',
        ]);

        $users->getCollection()->each(function ($user) {
            $user->avatar = $user->getFirstMediaUrl('avatar', 'thumb');
        });

        return $users;
    }

    /**
     * Get user by ID
     */
    public function getUserById(int $id): ?Model
    {
        try {
            $organizationId = $this->resolveOrganizationIdFromAuth();
            $authUser = Auth::user();

            $query = $this->userRepository
                ->query()
                ->with(['roles', 'detail.organization', 'detail.department', 'detail.departmentTitle']);

            $isAdminSelfLookup = $authUser?->isAdmin() && (int) $authUser->id === $id;
            if ($organizationId && !$isAdminSelfLookup) {
                $query->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId));
            }

            $user = $query->findOrFail($id);

            $user->avatar = $user->getFirstMediaUrl('avatar', 'thumb');

            return $user;
        } catch (ModelNotFoundException $e) {
            throw new ModelNotFoundException('User not found');
        }
    }

    /**
     * Create user
     */
    public function createUser(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            $userData = Arr::only($data, [
                'name',
                'email',
                'password',
                'is_active',
            ]);

            $detailData = Arr::only($data, self::DETAIL_KEYS);
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ($organizationId) {
                $detailData['organization_id'] = $organizationId;
            }
            $detailData = $this->normalizeDetailOrganizationData($detailData);
            if (array_key_exists('department_id', $detailData) && empty($detailData['department_id'])) {
                $detailData['department_title_id'] = null;
            }

            $user = $this->repository->create($userData);
            $user->assignRole($data['role'] ?? 'client');

            if (!empty($detailData)) {
                $user->detail()->updateOrCreate(
                    ['user_id' => $user->id],
                    $detailData
                );
            }

            $user->sendEmailVerificationNotification();

            return $user->load(['roles', 'detail.organization', 'detail.department', 'detail.departmentTitle', 'media']);
        });
    }

    /**
     * Update user
     */
    public function updateUser(int $id, array $data): Model
    {
        try {
            return DB::transaction(function () use ($id, $data) {
                $userData = Arr::only($data, [
                    'name',
                    'email',
                    'password',
                    'is_active',
                ]);

                $detailData = Arr::only($data, self::DETAIL_KEYS);
                $organizationId = $this->resolveOrganizationIdFromAuth();
                if ($organizationId) {
                    $detailData['organization_id'] = $organizationId;
                }
                $detailData = $this->normalizeDetailOrganizationData($detailData);
                if (array_key_exists('department_id', $detailData) && empty($detailData['department_id'])) {
                    $detailData['department_title_id'] = null;
                }

                $user = $this->repository->update($id, $userData);

                if (!empty($detailData)) {
                    $user->detail()->updateOrCreate(
                        ['user_id' => $user->id],
                        $detailData
                    );
                }

                return $user->load(['roles', 'detail.organization', 'detail.department', 'detail.departmentTitle', 'media']);
            });
        } catch (ModelNotFoundException $e) {
            throw new ModelNotFoundException('User not found');
        }
    }

    /**
     * Delete user
     */
    public function deleteUser(int $id): bool
    {
        try {
            $this->getUserById($id);
            $this->repository->delete($id);

            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    /**
     * Delete users
     */
    public function deleteUsers(array $ids): int
    {
        try {
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ($organizationId) {
                $countInScope = $this->userRepository
                    ->query()
                    ->whereIn('id', $ids)
                    ->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId))
                    ->count();

                if ($countInScope !== count($ids)) {
                    abort(404, 'Users not found');
                }
            }

            $count = $this->userRepository->bulkDelete($ids);
            if ($count === 0) {
                abort(404, 'Users not found');
            }

            return $count;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    /**
     * Get active users
     */
    public function getActiveUsers(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->userRepository->query()->where('is_active', true);
        if ($organizationId) {
            $query->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId));
        }

        return $query->get();
    }

    private function normalizeDetailOrganizationData(array $detailData): array
    {
        $departmentId = $detailData['department_id'] ?? null;
        if ($departmentId && empty($detailData['organization_id'])) {
            $organizationId = Department::query()
                ->where('id', $departmentId)
                ->value('organization_id');
            if ($organizationId) {
                $detailData['organization_id'] = (int) $organizationId;
            }
        }

        if (empty($detailData['organization_id'])) {
            $detailData['department_id'] = null;
            $detailData['department_title_id'] = null;
        }

        return $detailData;
    }

    private function resolveOrganizationIdFromAuth(): ?int
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

        return null;
    }
}
