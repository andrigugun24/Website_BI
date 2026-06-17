<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $notifications = Notification::where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhereNull('user_id');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $unreadCount = Notification::where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhereNull('user_id');
            })
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    public function markAsRead(Notification $notification)
    {
        $notification->update(['is_read' => true]);
        return response()->json(['message' => 'Notifikasi ditandai dibaca']);
    }

    public function markAllAsRead()
    {
        Notification::where('is_read', false)->update(['is_read' => true]);
        return response()->json(['message' => 'Semua ditandai dibaca']);
    }
}
