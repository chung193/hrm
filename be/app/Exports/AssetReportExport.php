<?php

namespace App\Exports;

use App\Exports\Support\ArraySheetExport;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AssetReportExport implements WithMultipleSheets
{
    public function __construct(protected readonly array $reportData) {}

    public function sheets(): array
    {
        return [
            new ArraySheetExport('Summary', ['Metric', 'Value'], $this->summaryRows()),
            new ArraySheetExport('By Department', ['Department', 'Count'], $this->labelCountRows($this->reportData['by_department'] ?? [])),
            new ArraySheetExport('By Status', ['Status', 'Count'], $this->labelCountRows($this->reportData['by_location_status'] ?? [])),
            new ArraySheetExport('Warranty Expiring', ['Asset Code', 'Name', 'Department', 'Current User', 'Warranty End'], $this->assetRows($this->reportData['warranty_expiring'] ?? [], true)),
            new ArraySheetExport('Damaged Lost', ['Asset Code', 'Name', 'Department', 'Current User', 'Condition'], $this->assetRows($this->reportData['damaged_or_lost'] ?? [], false, true)),
            new ArraySheetExport('Disposed', ['Asset Code', 'Name', 'Department', 'Current User'], $this->assetRows($this->reportData['disposed_assets'] ?? [])),
        ];
    }

    private function summaryRows(): array
    {
        $summary = $this->reportData['summary'] ?? [];

        return [
            ['Total Assets', $summary['total_assets'] ?? 0],
            ['In Use', $summary['in_use_assets'] ?? 0],
            ['In Storage', $summary['storage_assets'] ?? 0],
            ['Warranty Expiring', $summary['warranty_expiring_count'] ?? 0],
            ['Damaged / Lost', $summary['damaged_or_lost_count'] ?? 0],
            ['Disposed', $summary['disposed_count'] ?? 0],
        ];
    }

    private function labelCountRows(array $items): array
    {
        return array_map(
            fn (array $item) => [
                $item['label'] ?? '',
                $item['count'] ?? 0,
            ],
            $items
        );
    }

    private function assetRows(array $items, bool $includeWarrantyEnd = false, bool $includeCondition = false): array
    {
        return array_map(function (array $item) use ($includeWarrantyEnd, $includeCondition) {
            $row = [
                $item['asset_code'] ?? '',
                $item['name'] ?? '',
                $item['department']['name'] ?? '',
                $item['current_user']['name'] ?? '',
            ];

            if ($includeWarrantyEnd) {
                $row[] = $item['warranty_end_date'] ?? '';
            }

            if ($includeCondition) {
                $row[] = $item['condition_status'] ?? '';
            }

            return $row;
        }, $items);
    }
}
