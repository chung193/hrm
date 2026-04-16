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
        Schema::create('recruitment_request_hires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->date('hired_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['recruitment_request_id', 'user_id'], 'rrh_request_user_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruitment_request_hires');
    }
};

