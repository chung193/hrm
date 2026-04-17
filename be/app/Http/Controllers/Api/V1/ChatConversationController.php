<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\ChatConversationCreated;
use App\Events\ChatMessageCreated;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ChatConversationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('detail');
        $organizationId = (int) ($user->detail?->organization_id ?? 0);

        if ($organizationId <= 0) {
            throw ValidationException::withMessages([
                'organization_id' => 'User must belong to an organization to use chat.',
            ]);
        }

        $items = ChatConversation::query()
            ->with(['participants.detail', 'latestMessage.user'])
            ->where('organization_id', $organizationId)
            ->whereHas('participants', fn ($query) => $query->where('users.id', $user->id))
            ->orderByDesc(
                ChatMessage::query()
                    ->select('created_at')
                    ->whereColumn('conversation_id', 'chat_conversations.id')
                    ->latest()
                    ->limit(1)
            )
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (ChatConversation $conversation) => $this->transformConversation($conversation, $user->id));

        return $this->successResponse($items->values());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['direct', 'group'])],
            'name' => ['nullable', 'string', 'max:255'],
            'participant_ids' => ['nullable', 'array'],
            'participant_ids.*' => ['integer', 'exists:users,id'],
            'direct_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $user = $request->user()->loadMissing('detail');
        $organizationId = (int) ($user->detail?->organization_id ?? 0);
        if ($organizationId <= 0) {
            throw ValidationException::withMessages([
                'organization_id' => 'User must belong to an organization to use chat.',
            ]);
        }

        if ($validated['type'] === 'direct') {
            $otherUserId = (int) ($validated['direct_user_id'] ?? 0);
            if ($otherUserId <= 0 || $otherUserId === (int) $user->id) {
                throw ValidationException::withMessages([
                    'direct_user_id' => 'Please choose another user for a direct conversation.',
                ]);
            }

            $otherUser = $this->findParticipantInOrganization($otherUserId, $organizationId);
            $existing = $this->findExistingDirectConversation($organizationId, (int) $user->id, (int) $otherUser->id);
            if ($existing) {
                return $this->successResponse($this->transformConversation(
                    $existing->loadMissing(['participants.detail', 'latestMessage.user']),
                    (int) $user->id
                ));
            }

            $conversation = DB::transaction(function () use ($organizationId, $user, $otherUser) {
                $conversation = ChatConversation::query()->create([
                    'organization_id' => $organizationId,
                    'created_by_user_id' => $user->id,
                    'type' => 'direct',
                    'name' => null,
                ]);

                $now = now();

                $conversation->participants()->attach([
                    $user->id => ['joined_at' => $now, 'last_read_at' => $now],
                    $otherUser->id => ['joined_at' => $now, 'last_read_at' => null],
                ]);

                return $conversation;
            });

            $conversationPayload = $this->transformConversation(
                $conversation->loadMissing(['participants.detail', 'latestMessage.user']),
                (int) $user->id
            );

            broadcast(new ChatConversationCreated(
                $conversation->participants()->pluck('users.id')->map(fn ($id) => (int) $id)->all(),
                $conversationPayload
            ));

            return $this->createdResponse($conversationPayload);
        }

        $participantIds = collect($validated['participant_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->push((int) $user->id)
            ->unique()
            ->values();

        if ($participantIds->count() < 2) {
            throw ValidationException::withMessages([
                'participant_ids' => 'A group conversation needs at least 2 participants.',
            ]);
        }

        $participants = User::query()
            ->whereIn('id', $participantIds)
            ->whereHas('detail', fn ($query) => $query->where('organization_id', $organizationId))
            ->get();

        if ($participants->count() !== $participantIds->count()) {
            throw ValidationException::withMessages([
                'participant_ids' => 'All chat participants must belong to the same organization.',
            ]);
        }

        $conversation = DB::transaction(function () use ($organizationId, $user, $validated, $participantIds) {
            $conversation = ChatConversation::query()->create([
                'organization_id' => $organizationId,
                'created_by_user_id' => $user->id,
                'type' => 'group',
                'name' => $validated['name'] ?? null,
            ]);

            $attachPayload = [];
            foreach ($participantIds as $participantId) {
                $attachPayload[$participantId] = [
                    'joined_at' => now(),
                    'last_read_at' => $participantId === (int) $user->id ? now() : null,
                ];
            }

            $conversation->participants()->attach($attachPayload);

            return $conversation;
        });

        $conversationPayload = $this->transformConversation(
            $conversation->loadMissing(['participants.detail', 'latestMessage.user']),
            (int) $user->id
        );

        broadcast(new ChatConversationCreated(
            $conversation->participants()->pluck('users.id')->map(fn ($id) => (int) $id)->all(),
            $conversationPayload
        ));

        return $this->createdResponse($conversationPayload);
    }

    public function messages(Request $request, int $conversation): JsonResponse
    {
        $authUser = $request->user();
        $conversationModel = $this->findConversationForUser($conversation, (int) $authUser->id);

        $items = $conversationModel->messages()
            ->with('user')
            ->latest()
            ->paginate((int) $request->input('per_page', 50));

        $conversationModel->participants()->updateExistingPivot($authUser->id, [
            'last_read_at' => now(),
        ]);

        $payload = [
            'conversation' => $this->transformConversation(
                $conversationModel->loadMissing(['participants.detail', 'latestMessage.user']),
                (int) $authUser->id
            ),
            'messages' => $items->through(fn (ChatMessage $message) => $this->transformMessage($message)),
        ];

        return $this->successResponse($payload);
    }

    public function sendMessage(Request $request, int $conversation): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:4000'],
            'image' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp'],
        ]);

        if (!filled($validated['body'] ?? null) && !($request->hasFile('image'))) {
            throw ValidationException::withMessages([
                'body' => 'Please enter a message or choose an image.',
            ]);
        }

        $authUser = $request->user();
        $conversationModel = $this->findConversationForUser($conversation, (int) $authUser->id);

        $message = DB::transaction(function () use ($conversationModel, $authUser, $validated, $request) {
            $image = $request->file('image');
            $attachment = $this->storeChatImage($image);

            $message = $conversationModel->messages()->create([
                'user_id' => $authUser->id,
                'message_type' => $attachment ? 'image' : 'text',
                'body' => $validated['body'] ?? null,
                'attachment_path' => $attachment['path'] ?? null,
                'attachment_name' => $attachment['name'] ?? null,
                'attachment_mime' => $attachment['mime'] ?? null,
                'attachment_size' => $attachment['size'] ?? null,
            ]);

            $conversationModel->participants()->updateExistingPivot($authUser->id, [
                'last_read_at' => now(),
            ]);

            $conversationModel->touch();

            return $message->load('user');
        });

        $conversationPayload = $this->transformConversation(
            $conversationModel->fresh(['participants.detail', 'latestMessage.user']),
            (int) $authUser->id
        );
        $messagePayload = $this->transformMessage($message);

        broadcast(new ChatMessageCreated(
            $conversationModel->participants()->pluck('users.id')->map(fn ($id) => (int) $id)->all(),
            $conversationPayload,
            $messagePayload
        ));

        return $this->createdResponse($messagePayload);
    }

    private function findConversationForUser(int $conversationId, int $userId): ChatConversation
    {
        return ChatConversation::query()
            ->with(['participants.detail', 'latestMessage.user'])
            ->whereKey($conversationId)
            ->whereHas('participants', fn ($query) => $query->where('users.id', $userId))
            ->firstOrFail();
    }

    private function findParticipantInOrganization(int $userId, int $organizationId): User
    {
        return User::query()
            ->whereKey($userId)
            ->whereHas('detail', fn ($query) => $query->where('organization_id', $organizationId))
            ->firstOrFail();
    }

    private function findExistingDirectConversation(int $organizationId, int $firstUserId, int $secondUserId): ?ChatConversation
    {
        return ChatConversation::query()
            ->where('organization_id', $organizationId)
            ->where('type', 'direct')
            ->whereHas('participants', fn ($query) => $query->where('users.id', $firstUserId))
            ->whereHas('participants', fn ($query) => $query->where('users.id', $secondUserId))
            ->withCount('participants')
            ->get()
            ->first(fn (ChatConversation $conversation) => (int) $conversation->participants_count === 2);
    }

    private function transformConversation(ChatConversation $conversation, int $authUserId): array
    {
        $participants = $conversation->participants->map(function (User $participant) {
            return [
                'id' => $participant->id,
                'name' => $participant->name,
                'email' => $participant->email,
                'avatar' => $participant->avatar ?? '',
                'organization_id' => $participant->detail?->organization_id,
                'joined_at' => $participant->pivot?->joined_at,
                'last_read_at' => $participant->pivot?->last_read_at,
            ];
        })->values();

        $otherParticipants = $participants->filter(fn ($participant) => (int) $participant['id'] !== $authUserId)->values();
        $displayName = $conversation->type === 'group'
            ? ($conversation->name ?: 'Nhóm chat')
            : ($otherParticipants->first()['name'] ?? 'Direct chat');

        $authParticipant = $conversation->participants->firstWhere('id', $authUserId);
        $lastReadAt = $authParticipant?->pivot?->last_read_at;
        $unreadCount = $conversation->messages()
            ->when($lastReadAt, fn ($query) => $query->where('created_at', '>', $lastReadAt))
            ->where('user_id', '!=', $authUserId)
            ->count();

        return [
            'id' => $conversation->id,
            'organization_id' => $conversation->organization_id,
            'type' => $conversation->type,
            'name' => $displayName,
            'custom_name' => $conversation->name,
            'participants' => $participants,
            'unread_count' => $unreadCount,
            'latest_message' => $conversation->latestMessage ? $this->transformMessage($conversation->latestMessage) : null,
            'created_at' => $conversation->created_at,
            'updated_at' => $conversation->updated_at,
        ];
    }

    private function transformMessage(ChatMessage $message): array
    {
        $attributes = $message->getAttributes();
        $attachmentPath = $attributes['attachment_path'] ?? null;
        $attachmentName = $attributes['attachment_name'] ?? null;
        $attachmentMime = $attributes['attachment_mime'] ?? null;
        $attachmentSize = $attributes['attachment_size'] ?? null;
        $messageType = $attributes['message_type'] ?? null;
        $hasImage = !empty($attachmentPath);
        $previewText = filled($message->body)
            ? $message->body
            : ($hasImage ? 'Sent an image' : '');

        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'user_id' => $message->user_id,
            'body' => $message->body,
            'message_type' => $messageType ?: ($hasImage ? 'image' : 'text'),
            'preview_text' => $previewText,
            'attachment_url' => $hasImage ? Storage::disk('public')->url($attachmentPath) : null,
            'attachment_name' => $attachmentName,
            'attachment_mime' => $attachmentMime,
            'attachment_size' => $attachmentSize,
            'created_at' => $message->created_at,
            'updated_at' => $message->updated_at,
            'user' => $message->relationLoaded('user') && $message->user ? [
                'id' => $message->user->id,
                'name' => $message->user->name,
                'email' => $message->user->email,
                'avatar' => $message->user->avatar ?? '',
            ] : null,
        ];
    }

    private function storeChatImage(?UploadedFile $image): ?array
    {
        if (! $image) {
            return null;
        }

        $path = Storage::disk('public')->putFile('chat-images', $image);

        return [
            'path' => $path,
            'name' => $image->getClientOriginalName(),
            'mime' => $image->getClientMimeType(),
            'size' => $image->getSize(),
        ];
    }
}
