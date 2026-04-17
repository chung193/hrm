<?php

use App\Models\ChatConversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('organization.{organizationId}', function ($user, $organizationId) {
    $user->loadMissing('detail');

    if ((int) ($user->detail?->organization_id ?? 0) === (int) $organizationId || $user->isAdmin()) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }

    return false;
});

Broadcast::channel('chat.conversation.{conversationId}', function ($user, $conversationId) {
    return ChatConversation::query()
        ->whereKey($conversationId)
        ->whereHas('participants', fn ($query) => $query->where('users.id', $user->id))
        ->exists();
});

Broadcast::channel('chat.presence.{conversationId}', function ($user, $conversationId) {
    $exists = ChatConversation::query()
        ->whereKey($conversationId)
        ->whereHas('participants', fn ($query) => $query->where('users.id', $user->id))
        ->exists();

    if (! $exists) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
    ];
});
