<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecruitmentSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'leadership_department_id',
        'hr_department_id',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function leadershipDepartment()
    {
        return $this->belongsTo(Department::class, 'leadership_department_id');
    }

    public function hrDepartment()
    {
        return $this->belongsTo(Department::class, 'hr_department_id');
    }
}
