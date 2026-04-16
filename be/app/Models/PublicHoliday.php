<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicHoliday extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'holiday_date',
        'note',
        'is_active',
    ];

    protected $casts = [
        'holiday_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
