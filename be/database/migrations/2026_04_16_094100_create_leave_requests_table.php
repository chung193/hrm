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
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_no', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('department_title_id')->nullable()->constrained('department_titles')->nullOnDelete();
            $table->foreignId('approver_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('leave_type', ['annual', 'sick', 'unpaid', 'other'])->default('annual');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_days', 5, 2)->default(1);
            $table->text('reason');
            $table->text('rejection_reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('rejected_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};

