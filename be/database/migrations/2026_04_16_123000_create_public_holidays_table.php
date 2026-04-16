<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('public_holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('name');
            $table->date('holiday_date');
            $table->string('note')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('holiday_date');
            $table->unique(['organization_id', 'holiday_date', 'name'], 'public_holidays_org_date_name_unique');
        });

        $this->seedDefaultGlobalHolidays();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public_holidays');
    }

    private function seedDefaultGlobalHolidays(): void
    {
        $years = [Carbon::now()->year, Carbon::now()->year + 1];
        $defaults = [];

        foreach ($years as $year) {
            $defaults[] = ['name' => 'New Year', 'holiday_date' => "{$year}-01-01"];
            $defaults[] = ['name' => 'Reunification Day', 'holiday_date' => "{$year}-04-30"];
            $defaults[] = ['name' => 'International Workers Day', 'holiday_date' => "{$year}-05-01"];
            $defaults[] = ['name' => 'National Day', 'holiday_date' => "{$year}-09-02"];
        }

        foreach ($defaults as $holiday) {
            $exists = DB::table('public_holidays')
                ->whereNull('organization_id')
                ->where('name', $holiday['name'])
                ->whereDate('holiday_date', $holiday['holiday_date'])
                ->exists();

            if (!$exists) {
                DB::table('public_holidays')->insert([
                    'organization_id' => null,
                    'name' => $holiday['name'],
                    'holiday_date' => $holiday['holiday_date'],
                    'note' => null,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
};
