<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('audited_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('audited_at');
            $table->string('status', 50)->default('completed');
            $table->text('notes')->nullable();
            $table->json('summary')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status']);
            $table->index(['department_id', 'audited_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_audits');
    }
};
