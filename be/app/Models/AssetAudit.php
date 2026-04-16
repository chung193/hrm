<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'department_id',
        'audited_by_user_id',
        'audited_at',
        'status',
        'notes',
        'summary',
    ];

    protected $casts = [
        'audited_at' => 'datetime',
        'summary' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function auditedBy()
    {
        return $this->belongsTo(User::class, 'audited_by_user_id');
    }

    public function items()
    {
        return $this->hasMany(AssetAuditItem::class);
    }
}
