<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentTitle extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'code',
        'name',
        'is_active',
        'can_request_recruitment',
        'can_approve_leave',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'can_request_recruitment' => 'boolean',
        'can_approve_leave' => 'boolean',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function recruitmentRequests()
    {
        return $this->hasMany(RecruitmentRequest::class, 'requesting_department_title_id');
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'department_title_id');
    }
}
