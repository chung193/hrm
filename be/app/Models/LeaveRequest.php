<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_no',
        'organization_id',
        'user_id',
        'department_id',
        'department_title_id',
        'approver_user_id',
        'leave_type',
        'start_date',
        'end_date',
        'total_days',
        'reason',
        'rejection_reason',
        'status',
        'approved_at',
        'rejected_at',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_days' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'is_active' => 'boolean',
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
        return $this->belongsTo(DepartmentTitle::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }
}
