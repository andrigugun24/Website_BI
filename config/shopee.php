<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Shopee Open Platform API Configuration
    |--------------------------------------------------------------------------
    |
    | Configurasi untuk integrasi Shopee Open Platform API v2.
    | Akan diimplementasi penuh di Fase 4.
    |
    */

    'partner_id'   => env('SHOPEE_PARTNER_ID', ''),
    'partner_key'  => env('SHOPEE_PARTNER_KEY', ''),
    'shop_id'      => env('SHOPEE_SHOP_ID', ''),
    'access_token' => env('SHOPEE_ACCESS_TOKEN', ''),
    'api_url'      => env('SHOPEE_API_URL', 'https://partner.shopeemobile.com'),

    /*
    | API Endpoints (v2)
    */
    'endpoints' => [
        'get_order_list'   => '/api/v2/order/get_order_list',
        'get_order_detail' => '/api/v2/order/get_order_detail',
        'update_stock'     => '/api/v2/product/update_stock',
        'update_price'     => '/api/v2/product/update_price',
        'get_item_list'    => '/api/v2/product/get_item_list',
    ],

    /*
    | Webhook secret for verifying Shopee webhook calls
    */
    'webhook_secret' => env('SHOPEE_WEBHOOK_SECRET', ''),
];
