<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'code',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function titles()
    {
        return $this->hasMany(DepartmentTitle::class);
    }

    public function recruitmentRequests()
    {
        return $this->hasMany(RecruitmentRequest::class, 'requesting_department_id');
    }

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}
