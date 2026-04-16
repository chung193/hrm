<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserDetailFactory extends Factory
{
    protected $model = UserDetail::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'employee_code' => strtoupper($this->faker->bothify('EMP-####')),
            'organization_id' => null,
            'department_id' => null,
            'department_title_id' => null,
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->city(),
            'description' => $this->faker->sentence(),
            'position' => $this->faker->jobTitle(),
            'website' => $this->faker->url(),
            'github' => 'https://github.com/' . $this->faker->userName(),
            'join_date' => $this->faker->date(),
            'hired_at' => $this->faker->date(),
            'birthday' => $this->faker->date(),
        ];
    }
}
