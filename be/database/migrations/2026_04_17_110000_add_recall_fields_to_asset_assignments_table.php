<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->timestamp('recall_requested_at')->nullable()->after('returned_at');
            $table->unsignedBigInteger('recall_requested_by_user_id')->nullable()->after('recall_requested_at');
            $table->text('recall_note')->nullable()->after('recall_requested_by_user_id');

            $table->foreign('recall_requested_by_user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->dropForeign(['recall_requested_by_user_id']);
            $table->dropColumn([
                'recall_requested_at',
                'recall_requested_by_user_id',
                'recall_note',
            ]);
        });
    }
};
