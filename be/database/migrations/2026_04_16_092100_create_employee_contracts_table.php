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
        Schema::create('employee_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('contract_type_id')->constrained('contract_types')->restrictOnDelete();
            $table->string('contract_no', 100)->nullable()->unique();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('signed_date')->nullable();
            $table->enum('status', ['draft', 'active', 'expired', 'terminated'])->default('draft');
            $table->text('note')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_contracts');
    }
};

