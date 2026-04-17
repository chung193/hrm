<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SystemDatabaseNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected array $payload
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => $this->payload['kind'] ?? 'general',
            'title' => $this->payload['title'] ?? 'Notification',
            'message' => $this->payload['message'] ?? '',
            'action_url' => $this->payload['action_url'] ?? null,
            'entity_type' => $this->payload['entity_type'] ?? null,
            'entity_id' => $this->payload['entity_id'] ?? null,
            'organization_id' => $this->payload['organization_id'] ?? null,
            'meta' => $this->payload['meta'] ?? [],
        ];
    }
}
