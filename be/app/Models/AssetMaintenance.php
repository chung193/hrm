<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetMaintenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'asset_id',
        'type',
        'title',
        'description',
        'status',
        'vendor_name',
        'scheduled_at',
        'started_at',
        'completed_at',
        'cost',
        'next_maintenance_at',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'next_maintenance_at' => 'datetime',
        'cost' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
