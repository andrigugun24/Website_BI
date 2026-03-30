<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $notifications = Notification::orderBy('created_at', 'desc')->get();
        $unreadCount = Notification::where('is_read', false)->count();

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
