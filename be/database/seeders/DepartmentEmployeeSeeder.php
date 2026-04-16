<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Models\UserDetail;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DepartmentEmployeeSeeder extends Seeder
{
    private const TARGET_PER_DEPARTMENT = 100;
    private const DEFAULT_PASSWORD = '12345678';

    public function run(): void
    {
        $clientRole = Role::query()->firstOrCreate(
            ['name' => 'client', 'guard_name' => 'api'],
            ['description' => 'Client role with limited access']
        );

        $departments = Department::query()
            ->with(['organization', 'titles'])
            ->orderBy('organization_id')
            ->orderBy('id')
            ->get();

        if ($departments->isEmpty()) {
            $this->command?->warn('No departments found. Nothing to seed.');
            return;
        }

        foreach ($departments as $department) {
            $existingCount = UserDetail::query()
                ->where('department_id', $department->id)
                ->count();

            $missing = max(0, self::TARGET_PER_DEPARTMENT - $existingCount);

            if ($missing === 0) {
                $this->command?->info("Department #{$department->id} already has {$existingCount} employees. Skipped.");
                continue;
            }

            $titles = $department->titles->values();
            $startIndex = $existingCount + 1;

            for ($i = 0; $i < $missing; $i++) {
                $sequence = $startIndex + $i;
                $title = $titles->isNotEmpty() ? $titles->random() : null;
                $employeeCode = sprintf('EMP-O%02d-D%03d-%04d', $department->organization_id, $department->id, $sequence);
                $email = sprintf(
                    'emp.o%02d.d%03d.%04d@example.test',
                    $department->organization_id,
                    $department->id,
                    $sequence
                );

                $user = User::factory()->create([
                    'name' => fake()->name(),
                    'email' => $email,
                    'password' => self::DEFAULT_PASSWORD,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);

                $user->assignRole($clientRole);

                UserDetail::query()->create([
                    'user_id' => $user->id,
                    'employee_code' => $employeeCode,
                    'organization_id' => $department->organization_id,
                    'department_id' => $department->id,
                    'department_title_id' => $title?->id,
                    'phone' => fake()->phoneNumber(),
                    'address' => fake()->streetAddress(),
                    'city' => fake()->city(),
                    'description' => fake()->sentence(),
                    'position' => $title?->name ?? fake()->jobTitle(),
                    'website' => fake()->url(),
                    'github' => 'https://github.com/' . fake()->userName(),
                    'join_date' => Carbon::instance(fake()->dateTimeBetween('-3 years', 'now'))->toDateString(),
                    'hired_at' => Carbon::instance(fake()->dateTimeBetween('-3 years', 'now'))->toDateString(),
                    'birthday' => Carbon::instance(fake()->dateTimeBetween('-50 years', '-20 years'))->toDateString(),
                ]);
            }

            $this->command?->info(
                "Department #{$department->id} ({$department->name}) +{$missing} employees => 100 total"
            );
        }
    }
}
