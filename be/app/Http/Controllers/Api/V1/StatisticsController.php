<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatisticsController extends BaseApiController
{
    public function dashboard(): JsonResponse
    {
        try {
            $now = Carbon::now();
            $lastMonth = $now->copy()->subMonth();

            $totalUsers = User::count();

            $usersThisMonth = User::whereBetween('created_at', [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth(),
            ])->count();

            $usersLastMonth = User::whereBetween('created_at', [
                $lastMonth->copy()->startOfMonth(),
                $lastMonth->copy()->endOfMonth(),
            ])->count();

            $usersTrend = $usersLastMonth > 0
                ? (($usersThisMonth - $usersLastMonth) / $usersLastMonth * 100)
                : 0;

            $activeUsers = User::where('is_active', true)->count();
            $inactiveUsers = User::where('is_active', false)->count();

            $usersByRole = DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_type', User::class)
                ->select('roles.name', DB::raw('count(*) as count'))
                ->groupBy('roles.name')
                ->get()
                ->map(fn($role) => [
                    'name' => $role->name,
                    'count' => $role->count,
                ]);

            $recentUsers = User::latest('created_at')
                ->limit(5)
                ->get(['id', 'name', 'email', 'is_active', 'created_at']);

            return $this->successResponse([
                'summary' => [
                    [
                        'title' => 'Total Users',
                        'value' => $totalUsers,
                        'trend' => round($usersTrend, 2),
                        'icon' => 'Users',
                        'color' => 'primary',
                    ],
                ],
                'details' => [
                    'users' => [
                        'total' => $totalUsers,
                        'active' => $activeUsers,
                        'inactive' => $inactiveUsers,
                        'thisMonth' => $usersThisMonth,
                        'lastMonth' => $usersLastMonth,
                    ],
                ],
                'charts' => [
                    'usersByRole' => $usersByRole,
                ],
                'recentActivity' => [
                    'users' => $recentUsers,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->errorMessage($e->getMessage(), 500);
        }
    }

    public function monthlyTrends(): JsonResponse
    {
        try {
            $months = [];
            $userCounts = [];

            for ($i = 11; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $months[] = $date->format('M Y');

                $users = User::whereBetween('created_at', [
                    $date->copy()->startOfMonth(),
                    $date->copy()->endOfMonth(),
                ])->count();

                $userCounts[] = $users;
            }

            return $this->successResponse([
                'labels' => $months,
                'datasets' => [
                    [
                        'label' => 'Users',
                        'data' => $userCounts,
                        'backgroundColor' => 'rgba(59, 130, 246, 0.1)',
                        'borderColor' => 'rgb(59, 130, 246)',
                        'tension' => 0.4,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return $this->errorMessage($e->getMessage(), 500);
        }
    }
}
