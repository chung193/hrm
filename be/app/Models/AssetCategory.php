<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'parent_id',
        'code',
        'name',
        'description',
        'custom_field_schema',
        'is_active',
    ];

    protected $casts = [
        'custom_field_schema' => 'array',
        'is_active' => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function assets()
    {
        return $this->hasMany(Asset::class, 'category_id');
    }
}
