<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecruitmentRequestHire extends Model
{
    use HasFactory;

    protected $fillable = [
        'recruitment_request_id',
        'user_id',
        'hired_at',
        'note',
    ];

    protected $casts = [
        'hired_at' => 'date',
    ];

    public function recruitmentRequest()
    {
        return $this->belongsTo(RecruitmentRequest::class, 'recruitment_request_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

