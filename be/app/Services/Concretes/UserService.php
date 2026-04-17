<?php

namespace App\Services\Concretes;

use App\Models\Department;
use App\Repositories\User\Contracts\UserRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Auth\Access\AuthorizationException;
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
    private const SYSTEM_ROLE_NAMES = ['admin', 'super-admin', 'super admin'];
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

    public function __construct(protected UserRepositoryInterface $userRepository)
    {
        $this->setRepository($userRepository);
    }

    public function getUsers(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllUsers(): Collection
    {
        $organizationId = $this->resolveScopedOrganizationIdFromAuth();

        return $this->repository
            ->query()
            ->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId))
            ->get();
    }

    public function getFilteredUsers(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $perPage = request('per_page', $perPage);
        $organizationId = $this->resolveScopedOrganizationIdFromAuth();

        $users = $this->repository
            ->query()
            ->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId))
            ->paginate($perPage);

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

    public function getUserById(int $id): ?Model
    {
        try {
            $authUser = Auth::user();
            $organizationId = $this->resolveScopedOrganizationIdFromAuth(true);

            $query = $this->userRepository
                ->query()
                ->with(['roles', 'detail.organization', 'detail.department', 'detail.departmentTitle']);

            $isAdminSelfLookup = $authUser?->isAdmin() && (int) $authUser->id === $id;
            if (!$isAdminSelfLookup) {
                if (!$organizationId) {
                    throw ValidationException::withMessages([
                        'organization_id' => 'Organization context is required.',
                    ]);
                }

                $query->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId));
            }

            $user = $query->findOrFail($id);
            $user->avatar = $user->getFirstMediaUrl('avatar', 'thumb');

            return $user;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    public function createUser(array $data): Model
    {
        $organizationId = $this->resolveScopedOrganizationIdFromAuth();
        return $this->createUserInternal($data, $organizationId);
    }

    public function updateUser(int $id, array $data): Model
    {
        $organizationId = $this->resolveScopedOrganizationIdFromAuth();
        $this->assertUserInOrganizationScope($id, $organizationId);

        return $this->updateUserInternal($id, $data, $organizationId);
    }

    public function resetUserPassword(int $id, string $password): Model
    {
        $organizationId = $this->resolveScopedOrganizationIdFromAuth();
        $this->assertUserInOrganizationScope($id, $organizationId);

        try {
            return $this->repository->update($id, [
                'password' => $password,
            ]);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    public function deleteUser(int $id): bool
    {
        try {
            $organizationId = $this->resolveScopedOrganizationIdFromAuth();
            $this->assertUserInOrganizationScope($id, $organizationId);
            $this->repository->delete($id);

            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    public function deleteUsers(array $ids): int
    {
        $organizationId = $this->resolveScopedOrganizationIdFromAuth();

        $countInScope = $this->userRepository
            ->query()
            ->whereIn('id', $ids)
            ->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId))
            ->count();

        if ($countInScope !== count($ids)) {
            abort(404, 'Users not found');
        }

        $count = $this->userRepository->bulkDelete($ids);
        if ($count === 0) {
            abort(404, 'Users not found');
        }

        return $count;
    }

    public function getActiveUsers(): Collection
    {
        $organizationId = $this->resolveScopedOrganizationIdFromAuth();

        return $this->userRepository
            ->query()
            ->where('is_active', true)
            ->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId))
            ->get();
    }

    public function getAllUsersSystem(): Collection
    {
        $this->assertSystemAdmin();
        return $this->systemUserQuery()->get();
    }

    public function getFilteredUsersSystem(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $this->assertSystemAdmin();

        $perPage = request('per_page', $perPage);
        $users = $this->systemUserQuery()->paginate($perPage);

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

    public function getUserByIdSystem(int $id): ?Model
    {
        $this->assertSystemAdmin();

        try {
            $user = $this->systemUserQuery()
                ->with(['roles', 'detail.organization', 'detail.department', 'detail.departmentTitle'])
                ->findOrFail($id);

            $user->avatar = $user->getFirstMediaUrl('avatar', 'thumb');
            return $user;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    public function createUserSystem(array $data): Model
    {
        $this->assertSystemAdmin();
        return $this->createUserInternal($data, null, 'admin');
    }

    public function updateUserSystem(int $id, array $data): Model
    {
        $this->assertSystemAdmin();
        $this->systemUserQuery()->findOrFail($id);
        return $this->updateUserInternal($id, $data, null);
    }

    public function resetUserPasswordSystem(int $id, string $password): Model
    {
        $this->assertSystemAdmin();

        try {
            $this->systemUserQuery()->findOrFail($id);
            return $this->repository->update($id, [
                'password' => $password,
            ]);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    public function deleteUserSystem(int $id): bool
    {
        $this->assertSystemAdmin();

        try {
            $this->systemUserQuery()->findOrFail($id);
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    public function deleteUsersSystem(array $ids): int
    {
        $this->assertSystemAdmin();

        $found = $this->systemUserQuery()->whereIn('id', $ids)->count();
        if ($found !== count($ids)) {
            abort(404, 'Users not found');
        }

        $count = $this->userRepository->bulkDelete($ids);
        if ($count === 0) {
            abort(404, 'Users not found');
        }

        return $count;
    }

    public function getActiveUsersSystem(): Collection
    {
        $this->assertSystemAdmin();
        return $this->systemUserQuery()->where('is_active', true)->get();
    }

    private function createUserInternal(array $data, ?int $forcedOrganizationId = null, string $defaultRole = 'client'): Model
    {
        return DB::transaction(function () use ($data, $forcedOrganizationId, $defaultRole) {
            $userData = Arr::only($data, ['name', 'email', 'password', 'is_active']);
            $detailData = $this->buildDetailData($data, $forcedOrganizationId);

            $user = $this->repository->create($userData);
            $user->assignRole($data['role'] ?? $defaultRole);

            if (!empty($detailData)) {
                $user->detail()->updateOrCreate(['user_id' => $user->id], $detailData);
            }

            $user->sendEmailVerificationNotification();

            return $user->load(['roles', 'detail.organization', 'detail.department', 'detail.departmentTitle', 'media']);
        });
    }

    private function updateUserInternal(int $id, array $data, ?int $forcedOrganizationId = null): Model
    {
        try {
            return DB::transaction(function () use ($id, $data, $forcedOrganizationId) {
                $userData = Arr::only($data, ['name', 'email', 'password', 'is_active']);
                $detailData = $this->buildDetailData($data, $forcedOrganizationId);

                $user = $this->repository->update($id, $userData);

                if (!empty($detailData)) {
                    $user->detail()->updateOrCreate(['user_id' => $user->id], $detailData);
                }

                return $user->load(['roles', 'detail.organization', 'detail.department', 'detail.departmentTitle', 'media']);
            });
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('User not found');
        }
    }

    private function buildDetailData(array $data, ?int $forcedOrganizationId = null): array
    {
        $detailData = Arr::only($data, self::DETAIL_KEYS);

        if ($forcedOrganizationId !== null) {
            $detailData['organization_id'] = $forcedOrganizationId;
        }

        $detailData = $this->normalizeDetailOrganizationData($detailData);
        if (array_key_exists('department_id', $detailData) && empty($detailData['department_id'])) {
            $detailData['department_title_id'] = null;
        }

        return $detailData;
    }

    private function normalizeDetailOrganizationData(array $detailData): array
    {
        $departmentId = $detailData['department_id'] ?? null;
        if ($departmentId && empty($detailData['organization_id'])) {
            $organizationId = Department::query()->where('id', $departmentId)->value('organization_id');
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

    private function assertUserInOrganizationScope(int $id, int $organizationId): void
    {
        $exists = $this->userRepository
            ->query()
            ->where('id', $id)
            ->whereHas('detail', fn($q) => $q->where('organization_id', $organizationId))
            ->exists();

        if (!$exists) {
            throw new ModelNotFoundException('User not found');
        }
    }

    private function resolveScopedOrganizationIdFromAuth(bool $allowAdminWithoutScope = false): ?int
    {
        $authUser = Auth::user()?->loadMissing('detail');
        $requestedOrganizationId = (int) request('organization_id', 0);
        $userOrganizationId = (int) ($authUser?->detail?->organization_id ?? 0);

        if ($authUser?->isAdmin()) {
            if ($requestedOrganizationId > 0) {
                return $requestedOrganizationId;
            }

            if ($allowAdminWithoutScope) {
                return null;
            }

            throw ValidationException::withMessages([
                'organization_id' => 'Organization context is required.',
            ]);
        }

        if ($userOrganizationId > 0) {
            if ($requestedOrganizationId > 0 && $requestedOrganizationId !== $userOrganizationId) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot access another organization.',
                ]);
            }

            return $requestedOrganizationId > 0 ? $requestedOrganizationId : $userOrganizationId;
        }

        throw ValidationException::withMessages([
            'organization_id' => 'Organization context is required.',
        ]);
    }

    private function assertSystemAdmin(): void
    {
        $authUser = Auth::user();
        if (!$authUser?->isAdmin()) {
            throw new AuthorizationException('Forbidden. System admin access only.');
        }
    }

    private function systemUserQuery()
    {
        return $this->userRepository
            ->query()
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', self::SYSTEM_ROLE_NAMES);
            });
    }
}
