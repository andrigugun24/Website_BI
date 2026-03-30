<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * List products with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter underperforming
        if ($request->boolean('underperforming')) {
            $query->underperforming();
        }

        // Filter low stock
        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        $perPage = $request->input('per_page', 20);
        $products = $query->with('trendAnalyses', function ($q) {
            $q->latest('period_end')->limit(1);
        })->orderBy('name')->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Show a single product with latest trend.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load([
            'trendAnalyses' => function ($q) {
                $q->orderBy('period_end', 'desc')->limit(12);
            },
            'transactions' => function ($q) {
                $q->orderBy('transaction_date', 'desc')->limit(5);
            }
        ]);

        return response()->json([
            'product' => $product,
            'latest_trend' => $product->latestTrend,
        ]);
    }

    /**
     * Create a new product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:50|unique:products,sku',
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'current_stock' => 'required|integer|min:0',
            'min_stock_threshold' => 'nullable|integer|min:0',
            'shopee_item_id' => 'nullable|string|max:100',
            'image_url' => 'nullable|string|max:255',
        ]);

        $product = Product::create($validated);

        return response()->json([
            'message' => 'Produk berhasil ditambahkan.',
            'product' => $product,
        ], 201);
    }

    /**
     * Update a product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'sku' => 'sometimes|string|max:50|unique:products,sku,' . $product->id,
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'current_stock' => 'sometimes|integer|min:0',
            'min_stock_threshold' => 'nullable|integer|min:0',
            'shopee_item_id' => 'nullable|string|max:100',
            'image_url' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Produk berhasil diperbarui.',
            'product' => $product->fresh(),
        ]);
    }

    /**
     * Delete (soft-deactivate) a product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->update(['is_active' => false]);

        return response()->json([
            'message' => 'Produk berhasil dinonaktifkan.',
        ]);
    }

    /**
     * Get distinct categories.
     */
    public function categories(): JsonResponse
    {
        $categories = Product::select('category')
            ->whereNotNull('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json($categories);
    }
}
