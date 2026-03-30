<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Penjualan - Tataruma BI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #2a2a2a; }
        
        .header { background: #456254; color: white; padding: 20px 30px; }
        .header h1 { font-size: 18px; font-weight: bold; }
        .header p { font-size: 10px; opacity: 0.8; margin-top: 4px; }
        
        .meta { padding: 15px 30px; background: #f4e8dc; display: flex; font-size: 9px; }
        .meta-item { margin-right: 30px; }
        .meta-label { color: #8c827a; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
        .meta-value { color: #456254; font-weight: bold; font-size: 11px; margin-top: 2px; }
        
        .summary { padding: 20px 30px; }
        .summary h2 { font-size: 13px; color: #456254; margin-bottom: 12px; border-bottom: 2px solid #708f7f; padding-bottom: 6px; }
        
        .kpi-grid { width: 100%; margin-bottom: 20px; }
        .kpi-grid td { padding: 10px 15px; background: #fff8f3; border: 1px solid #f4e8dc; width: 25%; }
        .kpi-label { font-size: 8px; color: #8c827a; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
        .kpi-value { font-size: 16px; color: #456254; font-weight: bold; margin-top: 4px; }
        
        .data-section { padding: 10px 30px 30px; }
        .data-section h2 { font-size: 13px; color: #456254; margin-bottom: 10px; border-bottom: 2px solid #708f7f; padding-bottom: 6px; }
        
        table.data { width: 100%; border-collapse: collapse; font-size: 9px; }
        table.data th { background: #456254; color: white; padding: 8px 10px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        table.data td { padding: 7px 10px; border-bottom: 1px solid #f4e8dc; }
        table.data tr:nth-child(even) { background: #fff8f3; }
        table.data .text-right { text-align: right; }
        
        .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 30px; background: #f4e8dc; font-size: 8px; color: #8c827a; text-align: center; }
        .footer span { color: #456254; font-weight: bold; }
        
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PT Tataruma — Laporan Penjualan</h1>
        <p>Digenerate pada: {{ $generated_at }} | Periode: {{ $summary['period'] }}</p>
    </div>
    
    <table class="meta" style="width:100%;">
        <tr>
            <td style="padding:12px 20px; background:#f4e8dc; border:none;">
                <div class="meta-label">Total Transaksi</div>
                <div class="meta-value">{{ number_format($summary['total_transactions']) }}</div>
            </td>
            <td style="padding:12px 20px; background:#f4e8dc; border:none;">
                <div class="meta-label">Total Pendapatan</div>
                <div class="meta-value">Rp {{ number_format($summary['total_revenue'], 0, ',', '.') }}</div>
            </td>
            <td style="padding:12px 20px; background:#f4e8dc; border:none;">
                <div class="meta-label">Total Qty Terjual</div>
                <div class="meta-value">{{ number_format($summary['total_qty']) }} unit</div>
            </td>
            <td style="padding:12px 20px; background:#f4e8dc; border:none;">
                <div class="meta-label">Rata-rata Transaksi</div>
                <div class="meta-value">Rp {{ number_format($summary['avg_transaction'], 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    @if(!$summaryOnly && $transactions->count() > 0)
    <div class="data-section">
        <h2>Rincian Transaksi</h2>
        <table class="data">
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>SKU</th>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Harga</th>
                    <th class="text-right">Total</th>
                    <th>Sumber</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transactions as $trx)
                <tr>
                    <td>{{ $trx->transaction_date->format('d/m/Y') }}</td>
                    <td>{{ $trx->product->sku }}</td>
                    <td>{{ $trx->product->name }}</td>
                    <td>{{ $trx->product->category }}</td>
                    <td class="text-right">{{ $trx->quantity_sold }}</td>
                    <td class="text-right">Rp {{ number_format($trx->unit_price, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($trx->total_amount, 0, ',', '.') }}</td>
                    <td>{{ ucfirst($trx->source) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @else
    <div class="summary" style="padding-top:30px;">
        <h2>Ringkasan Eksekutif</h2>
        <p style="margin-top:10px; font-size:11px; color:#6d5b4b; line-height:1.6;">
            Dalam periode <strong>{{ $summary['period'] }}</strong>, tercatat total 
            <strong>{{ number_format($summary['total_transactions']) }}</strong> transaksi dengan pendapatan kumulatif sebesar 
            <strong>Rp {{ number_format($summary['total_revenue'], 0, ',', '.') }}</strong>. 
            Rata-rata per transaksi adalah <strong>Rp {{ number_format($summary['avg_transaction'], 0, ',', '.') }}</strong>.
        </p>
    </div>
    @endif

    <div class="footer">
        <span>Tataruma BI</span> © {{ date('Y') }} PT Tataruma. Dokumen ini digenerate secara otomatis oleh sistem.
    </div>
</body>
</html>
