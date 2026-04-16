<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserDetail extends Model
{
    use HasFactory;

    protected $table = 'user_details';

    protected $fillable = [
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
        'user_id',
    ];

    protected $casts = [
        'join_date' => 'date',
        'hired_at' => 'date',
        'birthday' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function departmentTitle()
    {
        return $this->belongsTo(DepartmentTitle::class, 'department_title_id');
    }
}
