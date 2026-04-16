<?php

namespace Database\Seeders;

use App\Models\ContractType;
use Illuminate\Database\Seeder;

class ContractTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'code' => 'PROBATION',
                'name' => 'Probation',
                'duration_months' => 2,
                'is_probation' => true,
                'is_indefinite' => false,
                'is_active' => true,
            ],
            [
                'code' => 'FIXED_12M',
                'name' => 'Fixed Term 1 Year',
                'duration_months' => 12,
                'is_probation' => false,
                'is_indefinite' => false,
                'is_active' => true,
            ],
            [
                'code' => 'FIXED_24M',
                'name' => 'Fixed Term 2 Years',
                'duration_months' => 24,
                'is_probation' => false,
                'is_indefinite' => false,
                'is_active' => true,
            ],
            [
                'code' => 'FIXED_60M',
                'name' => 'Fixed Term 5 Years',
                'duration_months' => 60,
                'is_probation' => false,
                'is_indefinite' => false,
                'is_active' => true,
            ],
            [
                'code' => 'INDEFINITE',
                'name' => 'Indefinite',
                'duration_months' => null,
                'is_probation' => false,
                'is_indefinite' => true,
                'is_active' => true,
            ],
        ];

        foreach ($items as $item) {
            ContractType::query()->updateOrCreate(['code' => $item['code']], $item);
        }
    }
}

