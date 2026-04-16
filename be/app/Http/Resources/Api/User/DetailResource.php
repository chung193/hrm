<?php

namespace App\Http\Resources\Api\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'employee_code' => $this->employee_code ?? null,
            'organization_id' => $this->organization_id ?? null,
            'department_id' => $this->department_id ?? null,
            'department_title_id' => $this->department_title_id ?? null,
            'address' => $this->address ?? null,
            'city' => $this->city ?? null,
            'phone' => $this->phone ?? null,
            'description' => $this->description ?? null,
            'position' => $this->position ?? null,
            'website' => $this->website ?? null,
            'github' => $this->github ?? null,
            'join_date' => optional($this->join_date)->toDateString(),
            'hired_at' => optional($this->hired_at)->toDateString(),
            'birthday' => optional($this->birthday)->toDateString(),
            'organization' => $this->whenLoaded('organization'),
            'department' => $this->whenLoaded('department'),
            'department_title' => $this->whenLoaded('departmentTitle'),
        ];
    }
}
