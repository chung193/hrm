<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('recruitment_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leadership_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('hr_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruitment_settings');
    }
};

