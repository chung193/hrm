<?php

namespace App\Services\Support;

use App\Events\UserNotificationCreated;
use App\Http\Resources\Api\Notification\NotificationResource;
use App\Notifications\SystemDatabaseNotification;
use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

class AppNotificationService
{
    public function notifyUser(User $user, array $payload): void
    {
        $normalized = $this->normalizePayload($payload);

        /** @var DatabaseNotification $notification */
        $notification = $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => SystemDatabaseNotification::class,
            'data' => [
                'kind' => $normalized['kind'],
                'title' => $normalized['title'],
                'message' => $normalized['message'],
                'action_url' => $normalized['action_url'],
                'entity_type' => $normalized['entity_type'],
                'entity_id' => $normalized['entity_id'],
                'organization_id' => $normalized['organization_id'],
                'meta' => $normalized['meta'],
            ],
        ]);

        broadcast(new UserNotificationCreated(
            (int) $user->id,
            (new NotificationResource($notification))->resolve()
        ));
    }

    public function notifyUsers(iterable $users, array $payload): void
    {
        foreach ($users as $user) {
            if ($user instanceof User) {
                $this->notifyUser($user, $payload);
            }
        }
    }

    public function notifyOrganization(int $organizationId, array $payload, ?int $excludeUserId = null): void
    {
        $users = User::query()
            ->whereHas('detail', fn ($query) => $query->where('organization_id', $organizationId))
            ->when($excludeUserId, fn ($query) => $query->where('id', '!=', $excludeUserId))
            ->get();

        $this->notifyUsers($users, [
            ...$payload,
            'organization_id' => $payload['organization_id'] ?? $organizationId,
        ]);
    }

    public function notifySystem(array $payload): void
    {
        $users = User::query()->get();
        $this->notifyUsers($users, $payload);
    }

    private function normalizePayload(array $payload): array
    {
        return [
            'kind' => $payload['kind'] ?? 'general',
            'title' => $payload['title'] ?? 'Notification',
            'message' => $payload['message'] ?? '',
            'action_url' => $payload['action_url'] ?? null,
            'entity_type' => $payload['entity_type'] ?? null,
            'entity_id' => $payload['entity_id'] ?? null,
            'organization_id' => $payload['organization_id'] ?? null,
            'meta' => $payload['meta'] ?? [],
        ];
    }
}
