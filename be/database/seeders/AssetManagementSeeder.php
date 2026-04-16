<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\AssetAudit;
use App\Models\AssetCategory;
use App\Models\AssetMaintenance;
use App\Models\Department;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AssetManagementSeeder extends Seeder
{
    public function run(): void
    {
        $organizations = Organization::with('departments')->get();
        if ($organizations->isEmpty()) {
            return;
        }

        foreach ($organizations as $organization) {
            $departments = Department::where('organization_id', $organization->id)->get();
            $users = User::query()
                ->whereHas('detail', fn ($query) => $query->where('organization_id', $organization->id))
                ->with('detail')
                ->get();

            $categories = $this->seedCategories($organization);
            $assets = collect();

            foreach ($departments as $deptIndex => $department) {
                $departmentUsers = $users->filter(fn ($user) => (int) optional($user->detail)->department_id === (int) $department->id)->values();

                foreach (range(1, 5) as $seq) {
                    $category = $categories[array_rand($categories)];
                    $assetCode = sprintf('AST-O%02d-D%03d-%03d', $organization->id, $department->id, $seq + ($deptIndex * 10));
                    $schema = $category->custom_field_schema ?? [];

                    $asset = Asset::updateOrCreate(
                        ['asset_code' => $assetCode],
                        [
                            'organization_id' => $organization->id,
                            'category_id' => $category->id,
                            'department_id' => $department->id,
                            'name' => $category->name . ' ' . $seq,
                            'qr_code' => $assetCode,
                            'purchase_date' => Carbon::now()->subMonths(rand(1, 24))->toDateString(),
                            'purchase_price' => rand(200, 5000),
                            'warranty_start_date' => Carbon::now()->subMonths(rand(1, 18))->toDateString(),
                            'warranty_end_date' => Carbon::now()->addMonths(rand(1, 18))->toDateString(),
                            'condition_status' => collect(['new', 'good', 'fair', 'damaged'])->random(),
                            'location_status' => collect(['storage', 'in_use', 'maintenance'])->random(),
                            'maintenance_status' => 'normal',
                            'disposal_status' => 'active',
                            'manufacturer' => collect(['Dell', 'HP', 'Lenovo', 'Canon', 'Brother', 'Panasonic'])->random(),
                            'brand' => collect(['Pro', 'Business', 'Enterprise'])->random(),
                            'model_name' => strtoupper(Str::random(6)),
                            'serial_number' => strtoupper(Str::random(12)),
                            'specifications' => [
                                'ram' => collect(['8GB', '16GB', '32GB'])->random(),
                                'storage' => collect(['256GB SSD', '512GB SSD', '1TB SSD'])->random(),
                                'cpu' => collect(['i5', 'i7', 'Ryzen 5'])->random(),
                            ],
                            'custom_field_values' => $this->buildCustomFieldValues($schema),
                            'is_active' => true,
                        ]
                    );

                    $assets->push($asset);

                    if ($departmentUsers->isNotEmpty() && rand(0, 100) > 35) {
                        $user = $departmentUsers->random();
                        $assignedAt = Carbon::now()->subDays(rand(1, 180));

                        $assignment = AssetAssignment::updateOrCreate(
                            [
                                'asset_id' => $asset->id,
                                'status' => 'assigned',
                            ],
                            [
                                'organization_id' => $organization->id,
                                'user_id' => $user->id,
                                'department_id' => $department->id,
                                'assigned_by_user_id' => $users->first()?->id,
                                'assignment_type' => 'assignment',
                                'assigned_at' => $assignedAt,
                                'due_back_at' => $assignedAt->copy()->addMonths(12),
                            ]
                        );

                        $asset->update([
                            'current_user_id' => $user->id,
                            'current_assignment_id' => $assignment->id,
                            'location_status' => 'in_use',
                        ]);
                    }

                    if (rand(0, 100) > 60) {
                        AssetMaintenance::updateOrCreate(
                            [
                                'asset_id' => $asset->id,
                                'title' => 'Periodic maintenance',
                            ],
                            [
                                'organization_id' => $organization->id,
                                'type' => 'maintenance',
                                'status' => collect(['scheduled', 'completed', 'in_progress'])->random(),
                                'scheduled_at' => Carbon::now()->addDays(rand(3, 45)),
                                'cost' => rand(20, 400),
                                'next_maintenance_at' => Carbon::now()->addMonths(6),
                                'notes' => 'Seeded maintenance record',
                            ]
                        );
                    }
                }
            }

            if ($assets->isNotEmpty()) {
                $audit = AssetAudit::updateOrCreate(
                    [
                        'organization_id' => $organization->id,
                        'notes' => 'Quarterly asset audit',
                    ],
                    [
                        'department_id' => $departments->first()?->id,
                        'audited_by_user_id' => $users->first()?->id,
                        'audited_at' => Carbon::now()->subDays(7),
                        'status' => 'completed',
                        'summary' => [],
                    ]
                );

                $audit->items()->delete();
                $summary = ['total' => 0, 'matched' => 0, 'mismatch' => 0, 'missing' => 0, 'found' => 0];

                foreach ($assets->take(8) as $asset) {
                    $actual = rand(0, 100) > 80 ? 'storage' : $asset->location_status;
                    $result = $actual === $asset->location_status ? 'matched' : 'mismatch';
                    $audit->items()->create([
                        'asset_id' => $asset->id,
                        'expected_location_status' => $asset->location_status,
                        'actual_location_status' => $actual,
                        'result_status' => $result,
                        'notes' => 'Seeded audit item',
                    ]);
                    $summary['total']++;
                    $summary[$result]++;
                }

                $audit->update(['summary' => $summary]);
            }
        }
    }

    private function seedCategories(Organization $organization): array
    {
        $it = AssetCategory::updateOrCreate(
            ['code' => 'IT-' . $organization->id],
            [
                'organization_id' => $organization->id,
                'name' => 'IT',
                'description' => 'Computers and devices',
                'custom_field_schema' => [
                    ['key' => 'cpu', 'label' => 'CPU', 'type' => 'text'],
                    ['key' => 'ram', 'label' => 'RAM', 'type' => 'select', 'options' => ['8GB', '16GB', '32GB']],
                    ['key' => 'mac_address', 'label' => 'MAC Address', 'type' => 'text'],
                ],
                'is_active' => true,
            ]
        );

        $laptop = AssetCategory::updateOrCreate(
            ['code' => 'IT-LAP-' . $organization->id],
            [
                'organization_id' => $organization->id,
                'parent_id' => $it->id,
                'name' => 'Laptop',
                'description' => 'Portable computers',
                'custom_field_schema' => [
                    ['key' => 'screen_size', 'label' => 'Screen Size', 'type' => 'text'],
                    ['key' => 'os', 'label' => 'OS', 'type' => 'select', 'options' => ['Windows', 'macOS', 'Ubuntu']],
                ],
                'is_active' => true,
            ]
        );

        $office = AssetCategory::updateOrCreate(
            ['code' => 'OFF-' . $organization->id],
            [
                'organization_id' => $organization->id,
                'name' => 'Office',
                'description' => 'Office furniture and equipment',
                'custom_field_schema' => [
                    ['key' => 'material', 'label' => 'Material', 'type' => 'text'],
                    ['key' => 'color', 'label' => 'Color', 'type' => 'text'],
                ],
                'is_active' => true,
            ]
        );

        $production = AssetCategory::updateOrCreate(
            ['code' => 'PRD-' . $organization->id],
            [
                'organization_id' => $organization->id,
                'name' => 'Production',
                'description' => 'Production machines and tools',
                'custom_field_schema' => [
                    ['key' => 'capacity', 'label' => 'Capacity', 'type' => 'text'],
                    ['key' => 'voltage', 'label' => 'Voltage', 'type' => 'text'],
                ],
                'is_active' => true,
            ]
        );

        return [$it, $laptop, $office, $production];
    }

    private function buildCustomFieldValues(array $schema): array
    {
        $values = [];
        foreach ($schema as $field) {
            $key = $field['key'] ?? null;
            if (!$key) {
                continue;
            }

            $values[$key] = match ($key) {
                'cpu' => collect(['Intel i5', 'Intel i7', 'Ryzen 5'])->random(),
                'ram' => collect(['8GB', '16GB', '32GB'])->random(),
                'mac_address' => strtoupper(Str::substr(md5(Str::random(10)), 0, 12)),
                'screen_size' => collect(['13"', '14"', '15.6"'])->random(),
                'os' => collect(['Windows', 'macOS', 'Ubuntu'])->random(),
                'material' => collect(['Wood', 'Steel', 'Aluminum'])->random(),
                'color' => collect(['Black', 'Gray', 'White'])->random(),
                'capacity' => collect(['20L', '50L', '100L'])->random(),
                'voltage' => collect(['220V', '380V'])->random(),
                default => 'N/A',
            };
        }

        return $values;
    }
}
