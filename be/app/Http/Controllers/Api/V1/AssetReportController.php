<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\AssetReportExport;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Asset;
use App\Services\Concerns\ResolvesOrganizationScope;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class AssetReportController extends BaseApiController
{
    use ResolvesOrganizationScope;

    public function overview(): JsonResponse
    {
        return $this->successResponse($this->buildOverviewData());
    }

    public function export()
    {
        return Excel::download(new AssetReportExport($this->buildOverviewData()), 'asset_report.xlsx');
    }

    private function buildOverviewData(): array
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $baseQuery = Asset::query()->when($organizationId, fn ($query) => $query->where('assets.organization_id', $organizationId));

        $departmentSummary = (clone $baseQuery)
            ->leftJoin('departments', 'assets.department_id', '=', 'departments.id')
            ->selectRaw('COALESCE(departments.name, ?) as label, COUNT(*) as count', ['Unassigned'])
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => ['label' => $row->label, 'count' => (int) $row->count])
            ->values()
            ->all();

        $locationSummary = (clone $baseQuery)
            ->select('location_status', DB::raw('COUNT(*) as count'))
            ->groupBy('location_status')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => ['label' => $row->location_status, 'count' => (int) $row->count])
            ->values()
            ->all();

        $warrantyExpiring = (clone $baseQuery)
            ->with(['category', 'department', 'currentUser'])
            ->whereNotNull('warranty_end_date')
            ->whereBetween('warranty_end_date', [Carbon::today(), Carbon::today()->addDays(30)])
            ->orderBy('warranty_end_date')
            ->limit(10)
            ->get()
            ->map(fn (Asset $asset) => $this->assetToArray($asset))
            ->values()
            ->all();

        $damagedOrLost = (clone $baseQuery)
            ->with(['category', 'department', 'currentUser'])
            ->whereIn('condition_status', ['damaged', 'broken', 'lost'])
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get()
            ->map(fn (Asset $asset) => $this->assetToArray($asset))
            ->values()
            ->all();

        $disposedAssets = (clone $baseQuery)
            ->with(['category', 'department', 'currentUser'])
            ->where('disposal_status', 'disposed')
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get()
            ->map(fn (Asset $asset) => $this->assetToArray($asset))
            ->values()
            ->all();

        return [
            'summary' => [
                'total_assets' => (clone $baseQuery)->count(),
                'in_use_assets' => (clone $baseQuery)->where('location_status', 'in_use')->count(),
                'storage_assets' => (clone $baseQuery)->where('location_status', 'storage')->count(),
                'warranty_expiring_count' => count($warrantyExpiring),
                'damaged_or_lost_count' => (clone $baseQuery)->whereIn('condition_status', ['damaged', 'broken', 'lost'])->count(),
                'disposed_count' => (clone $baseQuery)->where('disposal_status', 'disposed')->count(),
            ],
            'by_department' => $departmentSummary,
            'by_location_status' => $locationSummary,
            'warranty_expiring' => $warrantyExpiring,
            'damaged_or_lost' => $damagedOrLost,
            'disposed_assets' => $disposedAssets,
        ];
    }

    private function assetToArray(Asset $asset): array
    {
        return [
            'id' => $asset->id,
            'asset_code' => $asset->asset_code,
            'name' => $asset->name,
            'warranty_end_date' => optional($asset->warranty_end_date)->toDateString(),
            'condition_status' => $asset->condition_status,
            'department' => [
                'id' => $asset->department?->id,
                'name' => $asset->department?->name,
            ],
            'current_user' => [
                'id' => $asset->currentUser?->id,
                'name' => $asset->currentUser?->name,
            ],
        ];
    }
}
