<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserServiceInterface extends BaseServiceInterface
{
    // Organization-scoped user management
    public function getUsers(): Collection;

    public function getAllUsers(): Collection;

    public function getFilteredUsers(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getUserById(int $id): ?Model;

    public function createUser(array $data): Model;

    public function updateUser(int $id, array $data): Model;

    public function deleteUser(int $id): bool;

    public function deleteUsers(array $ids): int;
    public function getActiveUsers(): Collection;

    // System-wide user management (admin only)
    public function getAllUsersSystem(): Collection;

    public function getFilteredUsersSystem(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getUserByIdSystem(int $id): ?Model;

    public function createUserSystem(array $data): Model;

    public function updateUserSystem(int $id, array $data): Model;

    public function resetUserPasswordSystem(int $id, string $password): Model;

    public function deleteUserSystem(int $id): bool;

    public function deleteUsersSystem(array $ids): int;

    public function getActiveUsersSystem(): Collection;
}
