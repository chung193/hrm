<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeContract extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'contract_type_id',
        'contract_no',
        'start_date',
        'end_date',
        'signed_date',
        'status',
        'note',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'signed_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function contractType()
    {
        return $this->belongsTo(ContractType::class);
    }
}

