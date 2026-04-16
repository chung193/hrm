<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('asset_categories')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('current_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('current_assignment_id')->nullable();
            $table->string('asset_code', 100)->unique();
            $table->string('qr_code', 150)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 15, 2)->nullable();
            $table->date('warranty_start_date')->nullable();
            $table->date('warranty_end_date')->nullable();
            $table->string('condition_status', 50)->default('good');
            $table->string('location_status', 50)->default('storage');
            $table->string('maintenance_status', 50)->default('normal');
            $table->string('disposal_status', 50)->default('active');
            $table->string('manufacturer')->nullable();
            $table->string('brand')->nullable();
            $table->string('model_name')->nullable();
            $table->string('serial_number')->nullable();
            $table->json('specifications')->nullable();
            $table->json('custom_field_values')->nullable();
            $table->timestamp('last_audited_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['organization_id', 'category_id']);
            $table->index(['organization_id', 'department_id']);
            $table->index(['organization_id', 'location_status']);
            $table->index(['organization_id', 'condition_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
