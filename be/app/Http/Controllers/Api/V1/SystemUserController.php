<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\UserExport;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AssignUserRolesRequest;
use App\Http\Requests\Api\V1\UserDetailUpdateRequest;
use App\Http\Requests\Api\V1\UserStoreRequest;
use App\Http\Resources\Api\User\UserResource;
use App\Http\Resources\Api\User\UserWithDetailRoleResource;
use App\Models\User;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class SystemUserController extends BaseApiController
{
    public function __construct(
        protected readonly UserServiceInterface $userService
    ) {
        $this->middleware(function ($request, $next) {
            if (!auth()->user()?->isAdmin()) {
                throw new AuthorizationException('Forbidden. System admin access only.');
            }

            return $next($request);
        });
    }

    public function index(): JsonResponse
    {
        $users = $this->userService->getFilteredUsersSystem(request());
        return $this->successResponse(UserWithDetailRoleResource::collection($users));
    }

    public function all(): JsonResponse
    {
        $users = $this->userService->getAllUsersSystem();
        return $this->successResponse(UserResource::collection($users));
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getUserByIdSystem($id);
        return $this->successResponse(new UserWithDetailRoleResource($user));
    }

    public function store(UserStoreRequest $request): JsonResponse
    {
        $user = $this->userService->createUserSystem($request->validated());
        return $this->createdResponse(new UserResource($user));
    }

    public function update(UserDetailUpdateRequest $request, int $id): JsonResponse
    {
        $user = $this->userService->updateUserSystem($id, $request->validated());
        return $this->successResponse(new UserResource($user));
    }

    public function destroy(int $id): JsonResponse
    {
        $bool = $this->userService->deleteUserSystem($id);
        if ($bool) {
            return $this->successResponse(['message' => 'User deleted successfully']);
        }

        return $this->errorMessage('Error deleting user', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
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
        $users = $this->userService->getActiveUsersSystem();
        return $this->successResponse(UserResource::collection($users));
    }

    public function export()
    {
        $this->userService->getAllUsersSystem();
        return Excel::download(new UserExport(), 'system_users.xlsx');
    }

    public function assignRoles(int $id, AssignUserRolesRequest $request): JsonResponse
    {
        $this->userService->getUserByIdSystem($id);

        $user = User::findOrFail($id);
        $user->roles()->sync($request->input('role_ids', []));

        return response()->json([
            'success' => true,
            'data' => $user->load('roles'),
        ]);
    }
}
