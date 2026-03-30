<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\ActivityLogController;

class SettingController extends Controller
{
    /**
     * Get all settings as a key-value pair object
     */
    public function index(): JsonResponse
    {
        $settings = Setting::pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Bulk update settings
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        ActivityLogController::log('update', 'Settings', $request->all());

        return response()->json([
            'message' => 'Pengaturan berhasil disimpan.',
            'settings' => Setting::pluck('value', 'key')
        ]);
    }
}
