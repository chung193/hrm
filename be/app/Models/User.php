<?php

namespace App\Models;

use Eloquent;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\DatabaseNotificationCollection;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Spatie\Permission\Traits\HasRoles;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Traits\HasMediaImageConversions;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\VerifyEmailNotification;

class User extends Authenticatable implements JWTSubject, HasMedia, MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    use InteractsWithMedia, HasMediaImageConversions {
        HasMediaImageConversions::registerMediaConversions insteadof InteractsWithMedia;
    }
    protected $keyType = 'int';
    protected $primaryKey = 'id';
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     */
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')->singleFile();
    }

    public function detail()
    {
        return $this->hasOne(UserDetail::class);
    }

    public function employeeContracts()
    {
        return $this->hasMany(EmployeeContract::class);
    }

    public function recruitmentRequests()
    {
        return $this->hasMany(RecruitmentRequest::class, 'requested_by_user_id');
    }

    public function receivedRecruitmentRequests()
    {
        return $this->hasMany(RecruitmentRequest::class, 'received_by_user_id');
    }

    public function recruitmentHires()
    {
        return $this->hasMany(RecruitmentRequestHire::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function approvedLeaveRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'approver_user_id');
    }

    public function assignedAssets()
    {
        return $this->hasMany(Asset::class, 'current_user_id');
    }

    public function assetAssignments()
    {
        return $this->hasMany(AssetAssignment::class);
    }

    public function assetAssignmentActions()
    {
        return $this->hasMany(AssetAssignment::class, 'assigned_by_user_id');
    }

    public function assetAudits()
    {
        return $this->hasMany(AssetAudit::class, 'audited_by_user_id');
    }

    public function sendEmailVerificationNotification()
    {
        $this->notify(new VerifyEmailNotification());
    }

    public function isAdmin(): bool
    {
        return $this->getRoleNames()
            ->map(fn (string $role) => strtolower(trim($role)))
            ->intersect(['admin', 'super-admin', 'super admin'])
            ->isNotEmpty();
    }
}
