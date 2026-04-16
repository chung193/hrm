<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\UserExport;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AdminResetUserPasswordRequest;
use App\Http\Requests\Api\V1\AssignUserRolesRequest;
use App\Http\Requests\Api\V1\UserDetailUpdateRequest;
use App\Http\Requests\Api\V1\UserStoreRequest;
use App\Http\Resources\Api\User\UserResource;
use App\Http\Resources\Api\User\UserWithDetailRoleResource;
use App\Models\User;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class SystemUserController extends BaseApiController
{
    public function __construct(
        protected readonly UserServiceInterface $userService
    ) {}

    public function index(): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $users = $this->userService->getFilteredUsersSystem(request());
        return $this->successResponse(UserWithDetailRoleResource::collection($users));
    }

    public function all(): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $users = $this->userService->getAllUsersSystem();
        return $this->successResponse(UserResource::collection($users));
    }

    public function show(int $id): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $user = $this->userService->getUserByIdSystem($id);
        return $this->successResponse(new UserWithDetailRoleResource($user));
    }

    public function store(UserStoreRequest $request): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $user = $this->userService->createUserSystem($request->validated());
        return $this->createdResponse(new UserResource($user));
    }

    public function update(UserDetailUpdateRequest $request, int $id): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $user = $this->userService->updateUserSystem($id, $request->validated());
        return $this->successResponse(new UserResource($user));
    }

    public function resetPassword(AdminResetUserPasswordRequest $request, int $id): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $user = $this->userService->resetUserPasswordSystem($id, $request->validated('password'));

        return $this->successResponse([
            'message' => 'Password updated successfully',
            'user' => new UserResource($user),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $bool = $this->userService->deleteUserSystem($id);
        if ($bool) {
            return $this->successResponse(['message' => 'User deleted successfully']);
        }

        return $this->errorMessage('Error deleting user', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:users,id',
        ]);

        $count = $this->userService->deleteUsersSystem($validated['ids']);

        return $this->successResponse([
            'message' => "Deleted {$count} users successfully",
        ]);
    }

    public function active(): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $users = $this->userService->getActiveUsersSystem();
        return $this->successResponse(UserResource::collection($users));
    }

    public function export()
    {
        $this->authorizeSystemAdmin();
        $this->userService->getAllUsersSystem();
        return Excel::download(new UserExport(), 'system_users.xlsx');
    }

    public function assignRoles(int $id, AssignUserRolesRequest $request): JsonResponse
    {
        $this->authorizeSystemAdmin();
        $this->userService->getUserByIdSystem($id);

        $user = User::findOrFail($id);
        $user->roles()->sync($request->input('role_ids', []));

        return response()->json([
            'success' => true,
            'data' => $user->load('roles'),
        ]);
    }

    private function authorizeSystemAdmin(): void
    {
        if (!Auth::user()?->isAdmin()) {
            throw new AuthorizationException('Forbidden. System admin access only.');
        }
    }
}
