<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_audit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_audit_id')->constrained('asset_audits')->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('expected_location_status', 50)->nullable();
            $table->string('actual_location_status', 50)->nullable();
            $table->string('result_status', 50)->default('matched');
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['asset_audit_id', 'result_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_audit_items');
    }
};
