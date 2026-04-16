<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecruitmentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_no',
        'organization_id',
        'requested_by_user_id',
        'requesting_department_id',
        'requesting_department_title_id',
        'hr_department_id',
        'requested_position',
        'quantity',
        'reason',
        'note',
        'status',
        'received_by_user_id',
        'received_at',
        'status_updated_at',
        'is_active',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'received_at' => 'datetime',
        'status_updated_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function requestingDepartment()
    {
        return $this->belongsTo(Department::class, 'requesting_department_id');
    }

    public function requestingDepartmentTitle()
    {
        return $this->belongsTo(DepartmentTitle::class, 'requesting_department_title_id');
    }

    public function hrDepartment()
    {
        return $this->belongsTo(Department::class, 'hr_department_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    public function hires()
    {
        return $this->hasMany(RecruitmentRequestHire::class, 'recruitment_request_id');
    }
}
