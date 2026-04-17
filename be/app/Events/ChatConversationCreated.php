<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatConversationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public array $participantIds,
        public array $conversation
    ) {}

    public function broadcastOn(): array
    {
        return array_map(
            fn (int $userId) => new PrivateChannel("App.Models.User.{$userId}"),
            $this->participantIds
        );
    }

    public function broadcastAs(): string
    {
        return 'chat.conversation.created';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation' => $this->conversation,
        ];
    }
}
