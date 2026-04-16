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
        Schema::table('department_titles', function (Blueprint $table) {
            $table->boolean('can_request_recruitment')->default(false)->after('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('department_titles', function (Blueprint $table) {
            $table->dropColumn('can_request_recruitment');
        });
    }
};

