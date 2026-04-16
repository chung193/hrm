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
            $table->boolean('can_approve_leave')->default(false)->after('can_request_recruitment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('department_titles', function (Blueprint $table) {
            $table->dropColumn('can_approve_leave');
        });
    }
};

