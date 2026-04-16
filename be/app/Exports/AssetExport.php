<?php

namespace App\Exports;

use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AssetExport implements FromArray, WithHeadings
{
    public function __construct(protected readonly Collection $assets) {}

    public function array(): array
    {
        return $this->assets->map(function ($asset) {
            return [
                $asset->asset_code,
                $asset->qr_code,
                $asset->name,
                $asset->category?->name,
                $asset->department?->name,
                $asset->currentUser?->name,
                $asset->location_status,
                $asset->condition_status,
                optional($asset->purchase_date)->toDateString(),
                optional($asset->warranty_end_date)->toDateString(),
                $asset->is_active ? 'Active' : 'Inactive',
            ];
        })->values()->all();
    }

    public function headings(): array
    {
        return [
            'Asset Code',
            'QR Code',
            'Name',
            'Category',
            'Department',
            'Current User',
            'Location',
            'Condition',
            'Purchase Date',
            'Warranty End',
            'Status',
        ];
    }
}
