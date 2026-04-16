<?php

namespace App\Http\Resources\Api\ContractType;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'duration_months' => $this->duration_months,
            'is_probation' => $this->is_probation,
            'is_indefinite' => $this->is_indefinite,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

