<?php

namespace App\Http\Resources\Api\Recruitment;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecruitmentRequestHireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recruitment_request_id' => $this->recruitment_request_id,
            'user_id' => $this->user_id,
            'hired_at' => optional($this->hired_at)->toDateString(),
            'note' => $this->note,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user'),
        ];
    }
}

