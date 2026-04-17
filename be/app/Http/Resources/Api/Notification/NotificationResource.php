<?php

namespace App\Http\Resources\Api\Notification;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'kind' => $this->data['kind'] ?? 'general',
            'title' => $this->data['title'] ?? '',
            'message' => $this->data['message'] ?? '',
            'action_url' => $this->data['action_url'] ?? null,
            'entity_type' => $this->data['entity_type'] ?? null,
            'entity_id' => $this->data['entity_id'] ?? null,
            'organization_id' => $this->data['organization_id'] ?? null,
            'meta' => $this->data['meta'] ?? [],
            'is_read' => $this->read_at !== null,
            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }
}
