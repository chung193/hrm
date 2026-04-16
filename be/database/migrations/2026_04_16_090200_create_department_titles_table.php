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
        Schema::create('department_titles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')
                ->constrained('departments')
                ->restrictOnDelete();
            $table->string('code', 50);
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['department_id', 'code']);
            $table->unique(['id', 'department_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_titles');
    }
};
