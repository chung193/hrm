<?php

namespace App\Models;

use App\Traits\HasMediaImageConversions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Asset extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia, HasMediaImageConversions {
        HasMediaImageConversions::registerMediaConversions insteadof InteractsWithMedia;
    }

    protected $fillable = [
        'organization_id',
        'category_id',
        'department_id',
        'current_user_id',
        'current_assignment_id',
        'asset_code',
        'qr_code',
        'qr_image',
        'name',
        'description',
        'purchase_date',
        'purchase_price',
        'warranty_start_date',
        'warranty_end_date',
        'condition_status',
        'location_status',
        'maintenance_status',
        'disposal_status',
        'manufacturer',
        'brand',
        'model_name',
        'serial_number',
        'specifications',
        'custom_field_values',
        'last_audited_at',
        'is_active',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_start_date' => 'date',
        'warranty_end_date' => 'date',
        'last_audited_at' => 'datetime',
        'purchase_price' => 'decimal:2',
        'specifications' => 'array',
        'custom_field_values' => 'array',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'image_url',
        'image_thumb_url',
        'gallery_images',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images');
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->getFirstMediaUrl('images') ?: null;
    }

    public function getImageThumbUrlAttribute(): ?string
    {
        return $this->getFirstMediaUrl('images', 'thumb') ?: $this->getFirstMediaUrl('images') ?: null;
    }

    public function getGalleryImagesAttribute(): array
    {
        return $this->getMedia('images')->map(function ($media) {
            return [
                'id' => $media->id,
                'name' => $media->name,
                'url' => $media->getFullUrl(),
                'thumb' => $media->hasGeneratedConversion('thumb') ? $media->getFullUrl('thumb') : $media->getFullUrl(),
            ];
        })->values()->all();
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function category()
    {
        return $this->belongsTo(AssetCategory::class, 'category_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function currentUser()
    {
        return $this->belongsTo(User::class, 'current_user_id');
    }

    public function currentAssignment()
    {
        return $this->belongsTo(AssetAssignment::class, 'current_assignment_id');
    }

    public function assignments()
    {
        return $this->hasMany(AssetAssignment::class);
    }

    public function maintenances()
    {
        return $this->hasMany(AssetMaintenance::class);
    }

    public function auditItems()
    {
        return $this->hasMany(AssetAuditItem::class);
    }
}
