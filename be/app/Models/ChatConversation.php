<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'created_by_user_id',
        'type',
        'name',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function participants()
    {
        return $this->belongsToMany(User::class, 'chat_conversation_participants', 'conversation_id', 'user_id')
            ->withPivot(['joined_at', 'last_read_at'])
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }

    public function latestMessage()
    {
        return $this->hasOne(ChatMessage::class, 'conversation_id')->latestOfMany();
    }
}
