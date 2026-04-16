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
        Schema::table('recruitment_settings', function (Blueprint $table) {
            $table->foreignId('organization_id')
                ->nullable()
                ->after('id')
                ->constrained('organizations')
                ->cascadeOnDelete();
        });

        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->foreignId('organization_id')
                ->nullable()
                ->after('id')
                ->constrained('organizations')
                ->cascadeOnDelete();
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->foreignId('organization_id')
                ->nullable()
                ->after('id')
                ->constrained('organizations')
                ->cascadeOnDelete();
        });

        $this->backfillRecruitmentSettingsOrganization();
        $this->backfillRecruitmentRequestsOrganization();
        $this->backfillLeaveRequestsOrganization();

        Schema::table('recruitment_settings', function (Blueprint $table) {
            $table->unique('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recruitment_settings', function (Blueprint $table) {
            $table->dropUnique(['organization_id']);
            $table->dropConstrainedForeignId('organization_id');
        });

        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('organization_id');
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('organization_id');
        });
    }

    private function backfillRecruitmentSettingsOrganization(): void
    {
        DB::table('recruitment_settings')
            ->orderBy('id')
            ->get()
            ->each(function ($setting) {
                $organizationId = null;
                if ($setting->hr_department_id) {
                    $organizationId = DB::table('departments')->where('id', $setting->hr_department_id)->value('organization_id');
                }

                if (!$organizationId && $setting->leadership_department_id) {
                    $organizationId = DB::table('departments')->where('id', $setting->leadership_department_id)->value('organization_id');
                }

                if ($organizationId) {
                    DB::table('recruitment_settings')
                        ->where('id', $setting->id)
                        ->update(['organization_id' => $organizationId]);
                }
            });
    }

    private function backfillRecruitmentRequestsOrganization(): void
    {
        DB::table('recruitment_requests')
            ->orderBy('id')
            ->get()
            ->each(function ($request) {
                $organizationId = null;
                if ($request->requesting_department_id) {
                    $organizationId = DB::table('departments')
                        ->where('id', $request->requesting_department_id)
                        ->value('organization_id');
                }

                if ($organizationId) {
                    DB::table('recruitment_requests')
                        ->where('id', $request->id)
                        ->update(['organization_id' => $organizationId]);
                }
            });
    }

    private function backfillLeaveRequestsOrganization(): void
    {
        DB::table('leave_requests')
            ->orderBy('id')
            ->get()
            ->each(function ($leaveRequest) {
                $organizationId = null;
                if ($leaveRequest->department_id) {
                    $organizationId = DB::table('departments')
                        ->where('id', $leaveRequest->department_id)
                        ->value('organization_id');
                }

                if (!$organizationId && $leaveRequest->user_id) {
                    $organizationId = DB::table('user_details')
                        ->where('user_id', $leaveRequest->user_id)
                        ->value('organization_id');
                }

                if ($organizationId) {
                    DB::table('leave_requests')
                        ->where('id', $leaveRequest->id)
                        ->update(['organization_id' => $organizationId]);
                }
            });
    }
};
