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
        Schema::create('recruitment_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_no', 50)->unique();
            $table->foreignId('requested_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('requesting_department_id')->constrained('departments')->restrictOnDelete();
            $table->foreignId('requesting_department_title_id')->nullable()->constrained('department_titles')->nullOnDelete();
            $table->foreignId('hr_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('requested_position');
            $table->unsignedInteger('quantity')->default(1);
            $table->text('reason');
            $table->text('note')->nullable();
            $table->enum('status', ['pending', 'received', 'recruiting', 'interviewing', 'hired'])->default('pending');
            $table->foreignId('received_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('received_at')->nullable();
            $table->dateTime('status_updated_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruitment_requests');
    }
};

