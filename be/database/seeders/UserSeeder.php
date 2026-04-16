<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserDetail;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'chungvd.it@gmail.com',
            'password' => bcrypt('12345678'),
        ]);
        $user->assignRole('admin');

        $details = [
            'employee_code' => 'EMP-0001',
            'phone' => '0796496199',
            'address' => 'Ngo Quyen',
            'city' => 'Hai Phong',
            'description' => 'Tram tinh',
            'position' => 'Lap trinh vien',
            'website' => 'https://chungvd.com',
            'github' => 'https://github.com/chung193',
            'join_date' => now()->toDateString(),
            'hired_at' => now()->toDateString(),
            'birthday' => now()->toDateString(),
        ];

        UserDetail::query()->updateOrCreate(['user_id' => $user->id], $details);
    }
}
