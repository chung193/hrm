<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $organizationIds = DB::table('organizations')->pluck('id');
        if ($organizationIds->isEmpty()) {
            return;
        }

        $globalTypes = DB::table('contract_types')
            ->whereNull('organization_id')
            ->get();

        if ($globalTypes->isEmpty()) {
            return;
        }

        $now = now();

        foreach ($organizationIds as $organizationId) {
            foreach ($globalTypes as $type) {
                DB::table('contract_types')->updateOrInsert(
                    [
                        'organization_id' => $organizationId,
                        'code' => $type->code,
                    ],
                    [
                        'name' => $type->name,
                        'duration_months' => $type->duration_months,
                        'is_probation' => $type->is_probation,
                        'is_indefinite' => $type->is_indefinite,
                        'is_active' => $type->is_active,
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
            }
        }

        DB::table('contract_types')->whereNull('organization_id')->delete();
    }

    public function down(): void
    {
        $samples = DB::table('contract_types')
            ->whereNotNull('organization_id')
            ->select('code', 'name', 'duration_months', 'is_probation', 'is_indefinite', 'is_active')
            ->orderBy('id')
            ->get()
            ->unique('code')
            ->values();

        if ($samples->isEmpty()) {
            return;
        }

        $now = now();

        foreach ($samples as $type) {
            DB::table('contract_types')->updateOrInsert(
                [
                    'organization_id' => null,
                    'code' => $type->code,
                ],
                [
                    'name' => $type->name,
                    'duration_months' => $type->duration_months,
                    'is_probation' => $type->is_probation,
                    'is_indefinite' => $type->is_indefinite,
                    'is_active' => $type->is_active,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }
    }
};

