<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockRequest;
use App\Models\Product;
use App\Models\Role;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockRequestController extends Controller
{
    /**
     * Display a listing of stock requests.
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockRequest::with([
            'product:id,name,sku',
            'user:id,name',
            'approvedBy:id,name',
            'executedBy:id,name',
        ]);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        $perPage = $request->input('per_page', 20);
        $requests = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($requests);
    }

    /**
     * Store a newly created stock request.
     *
     * Alur:
     * - Barang Masuk (in): Manager/Admin membuat → notif ke Owner (approval)
     * - Barang Keluar (out): Manager/Owner membuat → notif ke Admin (eksekusi langsung)
     *   Barang Keluar langsung berstatus 'approved' karena dibuat oleh atasan.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'type'       => 'required|in:in,out',
            'quantity'   => 'required|integer|min:1',
            'notes'      => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $userRole = $user->role?->slug;
        $product = Product::findOrFail($validated['product_id']);

        // Validasi role berdasarkan tipe permintaan
        if ($validated['type'] === 'in' && !in_array($userRole, ['admin', 'manager'])) {
            return response()->json([
                'message' => 'Hanya Admin atau Manager yang dapat membuat permintaan barang masuk.',
            ], 403);
        }

        if ($validated['type'] === 'out' && !in_array($userRole, ['manager', 'owner'])) {
            return response()->json([
                'message' => 'Hanya Manager atau Owner yang dapat membuat permintaan barang keluar.',
            ], 403);
        }

        $validated['user_id'] = $user->id;

        // Barang keluar langsung approved (dibuat oleh atasan)
        // Barang masuk perlu approval Owner
        $validated['status'] = $validated['type'] === 'out' ? 'approved' : 'pending';

        $stockRequest = StockRequest::create($validated);
        $stockRequest->load(['product', 'user']);

        // Kirim notifikasi berdasarkan tipe
        if ($validated['type'] === 'in') {
            // Barang Masuk → Notif ke semua Owner untuk approval
            NotificationService::createForRole(
                Role::OWNER,
                "📦 Permintaan Barang Masuk",
                "{$user->name} mengajukan permintaan barang masuk untuk produk {$product->name} ({$product->sku}) sejumlah {$validated['quantity']} unit. Menunggu persetujuan Anda.",
                'info'
            );
        } else {
            // Barang Keluar → Notif ke semua Admin untuk eksekusi
            NotificationService::createForRole(
                Role::ADMIN,
                "📤 Perintah Barang Keluar",
                "{$user->name} memerintahkan pengeluaran barang {$product->name} ({$product->sku}) sejumlah {$validated['quantity']} unit. Silakan eksekusi perintah ini.",
                'info'
            );
        }

        return response()->json([
            'message' => 'Permintaan stok berhasil diajukan.',
            'stock_request' => $stockRequest,
        ], 201);
    }

    /**
     * Update the status of the specified stock request (Approve/Reject).
     *
     * Hanya untuk Barang Masuk yang pending.
     * Hanya Owner yang bisa approve/reject.
     * Setelah approved → notif ke Admin untuk eksekusi.
     * Setelah rejected → notif ke pembuat permintaan.
     */
    public function updateStatus(Request $request, StockRequest $stockRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        if ($stockRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Permintaan stok ini sudah diproses.',
            ], 400);
        }

        $user = $request->user();
        $stockRequest->status = $validated['status'];
        $stockRequest->approved_by = $user->id;
        $stockRequest->save();

        $stockRequest->load(['product', 'user']);
        $product = $stockRequest->product;

        if ($validated['status'] === 'approved') {
            // Approved → Notif ke semua Admin untuk eksekusi
            NotificationService::createForRole(
                Role::ADMIN,
                "✅ Permintaan Barang Masuk Disetujui",
                "Permintaan barang masuk {$product->name} ({$product->sku}) sejumlah {$stockRequest->quantity} unit telah disetujui oleh {$user->name}. Silakan eksekusi/input barang ke gudang.",
                'success'
            );

            // Notif ke pembuat permintaan
            NotificationService::createForUser(
                $stockRequest->user_id,
                "✅ Permintaan Disetujui",
                "Permintaan barang masuk Anda untuk {$product->name} sejumlah {$stockRequest->quantity} unit telah disetujui oleh {$user->name}. Menunggu eksekusi oleh Admin.",
                'success'
            );
        } else {
            // Rejected → Notif ke pembuat permintaan
            NotificationService::createForUser(
                $stockRequest->user_id,
                "❌ Permintaan Ditolak",
                "Permintaan barang masuk Anda untuk {$product->name} sejumlah {$stockRequest->quantity} unit telah ditolak oleh {$user->name}.",
                'danger'
            );
        }

        return response()->json([
            'message' => 'Status permintaan stok berhasil diperbarui.',
            'stock_request' => $stockRequest->load(['product', 'user', 'approvedBy']),
        ]);
    }

    /**
     * Execute a stock request (update actual stock).
     *
     * Hanya Admin yang bisa eksekusi.
     * Berlaku untuk:
     * - Barang Masuk yang sudah approved
     * - Barang Keluar yang sudah approved (langsung dari pembuatan)
     */
    public function execute(Request $request, StockRequest $stockRequest): JsonResponse
    {
        if ($stockRequest->status !== 'approved') {
            return response()->json([
                'message' => 'Hanya permintaan yang sudah disetujui yang dapat dieksekusi.',
            ], 400);
        }

        $user = $request->user();
        $product = $stockRequest->product;

        // Update stok
        if ($stockRequest->type === 'in') {
            $product->increment('current_stock', $stockRequest->quantity);
        } else {
            if ($product->current_stock < $stockRequest->quantity) {
                return response()->json([
                    'message' => "Stok tidak mencukupi. Stok saat ini: {$product->current_stock}, diminta: {$stockRequest->quantity}.",
                ], 400);
            }
            $product->decrement('current_stock', $stockRequest->quantity);
        }

        // Update status
        $stockRequest->status = 'completed';
        $stockRequest->executed_by = $user->id;
        $stockRequest->save();

        // Notif ke pembuat permintaan
        $typeText = $stockRequest->type === 'in' ? 'masuk' : 'keluar';
        NotificationService::createForUser(
            $stockRequest->user_id,
            "🏁 Permintaan Stok Selesai",
            "Permintaan barang {$typeText} untuk {$product->name} ({$product->sku}) sejumlah {$stockRequest->quantity} unit telah dieksekusi oleh {$user->name}. Stok terkini: {$product->current_stock} unit.",
            'success'
        );

        // Cek low stock setelah eksekusi
        NotificationService::checkLowStock($product);

        return response()->json([
            'message' => 'Permintaan stok berhasil dieksekusi. Stok telah diperbarui.',
            'stock_request' => $stockRequest->load(['product', 'user', 'approvedBy', 'executedBy']),
        ]);
    }
}
