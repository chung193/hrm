<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends BaseApiController
{
    public function global(Request $request): JsonResponse
    {
        try {
            $query = $request->query('q', '');
            $limit = $request->query('limit', 10);

            if (strlen($query) < 2) {
                return $this->successResponse([
                    'users' => [],
                ]);
            }

            $users = User::where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%");
                })
                ->limit($limit)
                ->get(['id', 'name', 'email']);

            return $this->successResponse([
                'users' => $users,
            ]);
        } catch (\Exception $e) {
            return $this->errorMessage($e->getMessage(), 500);
        }
    }

    public function users(Request $request): JsonResponse
    {
        try {
            $query = $request->query('q', '');
            $limit = $request->query('limit', 20);

            if (strlen($query) < 2) {
                return $this->successResponse([]);
            }

            $users = User::where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%");
                })
                ->limit($limit)
                ->get(['id', 'name', 'email']);

            return $this->successResponse($users);
        } catch (\Exception $e) {
            return $this->errorMessage($e->getMessage(), 500);
        }
    }
}
