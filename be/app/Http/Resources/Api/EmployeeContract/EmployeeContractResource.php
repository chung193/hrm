<?php

namespace App\Http\Resources\Api\EmployeeContract;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'contract_type_id' => $this->contract_type_id,
            'contract_no' => $this->contract_no,
            'start_date' => optional($this->start_date)->toDateString(),
            'end_date' => optional($this->end_date)->toDateString(),
            'signed_date' => optional($this->signed_date)->toDateString(),
            'status' => $this->status,
            'note' => $this->note,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user'),
            'contract_type' => $this->whenLoaded('contractType'),
        ];
    }
}

