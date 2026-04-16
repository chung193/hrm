<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('employees')) {
            Schema::drop('employees');
        }

        if (Schema::hasColumn('user_details', 'key')) {
            DB::statement('
                DELETE ud1 FROM user_details ud1
                INNER JOIN user_details ud2
                    ON ud1.user_id = ud2.user_id
                    AND ud1.id > ud2.id
            ');
        }

        Schema::table('user_details', function (Blueprint $table) {
            if (Schema::hasColumn('user_details', 'key')) {
                $table->dropColumn('key');
            }

            if (Schema::hasColumn('user_details', 'value')) {
                $table->dropColumn('value');
            }

            $table->string('employee_code', 50)->nullable()->unique()->after('id');
            $table->unsignedBigInteger('organization_id')->nullable()->after('employee_code');
            $table->unsignedBigInteger('department_id')->nullable()->after('organization_id');
            $table->unsignedBigInteger('department_title_id')->nullable()->after('department_id');
            $table->string('phone', 20)->nullable()->after('department_title_id');
            $table->string('address')->nullable()->after('phone');
            $table->string('city')->nullable()->after('address');
            $table->longText('description')->nullable()->after('city');
            $table->string('position')->nullable()->after('description');
            $table->string('website')->nullable()->after('position');
            $table->string('github')->nullable()->after('website');
            $table->date('join_date')->nullable()->after('github');
            $table->date('hired_at')->nullable()->after('join_date');
            $table->date('birthday')->nullable()->after('hired_at');
            $table->unique('user_id');

            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->nullOnDelete();

            $table->foreign('department_id')
                ->references('id')
                ->on('departments')
                ->nullOnDelete();

            $table->foreign(['department_title_id', 'department_id'])
                ->references(['id', 'department_id'])
                ->on('department_titles')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_details', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['department_title_id', 'department_id']);

            $table->dropUnique(['employee_code']);
            $table->dropUnique(['user_id']);

            $table->dropColumn([
                'employee_code',
                'organization_id',
                'department_id',
                'department_title_id',
                'phone',
                'address',
                'city',
                'description',
                'position',
                'website',
                'github',
                'join_date',
                'hired_at',
                'birthday',
            ]);

            $table->string('key')->nullable();
            $table->string('value')->nullable();
        });
    }
};
