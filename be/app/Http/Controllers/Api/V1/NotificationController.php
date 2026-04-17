<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\BroadcastNotificationRequest;
use App\Http\Resources\Api\Notification\NotificationResource;
use App\Models\User;
use App\Services\Support\AppNotificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends BaseApiController
{
    public function __construct(
        protected AppNotificationService $notificationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $items = $user->notifications()
            ->when($request->boolean('unread_only'), fn ($query) => $query->whereNull('read_at'))
            ->orderByRaw('read_at is null desc')
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return $this->successResponse(NotificationResource::collection($items));
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return $this->successResponse([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return $this->successResponse([
            'message' => 'Notification marked as read',
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->successResponse([
            'message' => 'All notifications marked as read',
        ]);
    }

    public function broadcast(BroadcastNotificationRequest $request): JsonResponse
    {
        $this->assertAdmin();

        $validated = $request->validated();
        $payload = [
            'kind' => $validated['kind'] ?? 'announcement',
            'title' => $validated['title'],
            'message' => $validated['message'],
            'action_url' => $validated['action_url'] ?? null,
            'organization_id' => $validated['organization_id'] ?? null,
        ];

        if ($validated['audience_type'] === 'users') {
            $users = User::query()->whereIn('id', $validated['user_ids'] ?? [])->get();
            $this->notificationService->notifyUsers($users, $payload);
        } elseif ($validated['audience_type'] === 'organization') {
            $this->notificationService->notifyOrganization((int) $validated['organization_id'], $payload);
        } else {
            $this->notificationService->notifySystem($payload);
        }

        return $this->successResponse([
            'message' => 'Notification broadcasted successfully',
        ]);
    }

    private function assertAdmin(): void
    {
        if (!Auth::user()?->isAdmin()) {
            throw new AuthorizationException('Forbidden. Administrator access only.');
        }
    }
}
