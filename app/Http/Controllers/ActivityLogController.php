<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = ActivityLog::with(['user:id,name,role_id', 'user.role:id,slug,name'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 50));

        return response()->json($logs);
    }

    public static function log($action, $resource = null, $details = null)
    {
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'resource' => $resource,
            'details' => is_array($details) || is_object($details) ? json_encode($details) : json_encode(['info' => $details])
        ]);
    }
}
