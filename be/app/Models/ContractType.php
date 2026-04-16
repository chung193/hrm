<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContractType extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'code',
        'name',
        'duration_months',
        'is_probation',
        'is_indefinite',
        'is_active',
    ];

    protected $casts = [
        'duration_months' => 'integer',
        'is_probation' => 'boolean',
        'is_indefinite' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function employeeContracts()
    {
        return $this->hasMany(EmployeeContract::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
