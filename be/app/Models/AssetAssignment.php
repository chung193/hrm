<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'asset_id',
        'user_id',
        'department_id',
        'assigned_by_user_id',
        'assignment_type',
        'status',
        'assigned_at',
        'due_back_at',
        'returned_at',
        'recall_requested_at',
        'recall_requested_by_user_id',
        'recall_note',
        'return_reason',
        'handover_notes',
        'metadata',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'due_back_at' => 'datetime',
        'returned_at' => 'datetime',
        'recall_requested_at' => 'datetime',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function recallRequestedBy()
    {
        return $this->belongsTo(User::class, 'recall_requested_by_user_id');
    }
}
