import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Download, Filter, Calendar } from 'lucide-react';

export default function Reports() {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(null);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        category: '',
    });
    const user = JSON.parse(localStorage.getItem('user'));
    const isOwner = user?.role === 'owner';

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.category) params.append('category', filters.category);

            const result = await api.getReportPreview(params.toString());
            setPreview(result);
        } catch (e) {
            console.error("Report preview error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPreview(); }, []);

    const handleExport = async (type) => {
        setExporting(type);
        try {
            const params = new URLSearchParams();
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (filters.category) params.append('category', filters.category);

            const url = type === 'csv'
                ? `/api/reports/export/csv?${params.toString()}`
                : `/api/reports/export/pdf?${params.toString()}`;

            const token = localStorage.getItem('token');
            const appUrl = window.appUrl || '';

            const response = await fetch(`${appUrl}${url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': type === 'csv' ? 'text/csv' : 'application/pdf',
                }
            });

            if (!response.ok) throw new Error('Export gagal');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `laporan_penjualan.${type}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (e) {
            console.error("Export error", e);
            alert('Gagal mengeksport laporan. Pastikan server berjalan.');
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Pelaporan</h2>
                    <p className="text-accent font-medium mt-1">Pratinjau dan ekspor data transaksi penjualan</p>
                </div>
                <div className="flex gap-2">
                    {!isOwner && (
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={exporting === 'csv'}
                            className="bg-white border border-accent/20 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 text-on-surface hover:bg-surface transition-colors disabled:opacity-50"
                        >
                            <Download size={16} />
                            {exporting === 'csv' ? 'Mendownload...' : 'Export CSV'}
                        </button>
                    )}
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={exporting === 'pdf'}
                        className="bg-[#456254] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#384f44] transition-colors disabled:opacity-50"
                    >
                        <FileText size={16} />
                        {exporting === 'pdf' ? 'Mendownload...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-accent/10">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={16} className="text-accent" />
                    <h3 className="font-bold text-primary text-sm">Filter Data</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8c827a] uppercase tracking-widest">Tanggal Mulai</label>
                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={e => setFilters(f => ({...f, start_date: e.target.value}))}
                            className="w-full px-3 py-2 border border-accent/20 rounded-lg text-sm text-on-surface bg-surface focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8c827a] uppercase tracking-widest">Tanggal Akhir</label>
                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={e => setFilters(f => ({...f, end_date: e.target.value}))}
                            className="w-full px-3 py-2 border border-accent/20 rounded-lg text-sm text-on-surface bg-surface focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8c827a] uppercase tracking-widest">Kategori</label>
                        <input
                            type="text"
                            value={filters.category}
                            onChange={e => setFilters(f => ({...f, category: e.target.value}))}
                            placeholder="Semua kategori"
                            className="w-full px-3 py-2 border border-accent/20 rounded-lg text-sm text-on-surface bg-surface focus:ring-1 focus:ring-primary outline-none placeholder:text-accent/50"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchPreview}
                            disabled={loading}
                            className="w-full py-2.5 bg-[#456254] text-white rounded-lg font-semibold text-sm hover:bg-[#384f44] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Memuat...' : 'Terapkan Filter'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary KPI */}
            {preview?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-accent/10">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Total Transaksi</p>
                        <h3 className="text-2xl font-black text-primary font-headline">{preview.summary.total_records}</h3>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-accent/10">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Total Pendapatan</p>
                        <h3 className="text-2xl font-black text-primary font-headline">
                            Rp {Number(preview.summary.total_revenue).toLocaleString('id-ID')}
                        </h3>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-accent/10">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Total Qty Terjual</p>
                        <h3 className="text-2xl font-black text-primary font-headline">{preview.summary.total_qty}</h3>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-accent/10">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Rata-rata Transaksi</p>
                        <h3 className="text-2xl font-black text-primary font-headline">
                            Rp {Number(preview.summary.avg_transaction).toLocaleString('id-ID')}
                        </h3>
                    </div>
                </div>
            )}

            {/* Data Table Preview */}
            {!isOwner && preview?.data && preview.data.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
                    <div className="px-6 py-5 border-b border-accent/10 flex justify-between items-center bg-surface/30">
                        <h3 className="font-bold text-primary text-sm">
                            Pratinjau Data ({preview.data.length} dari {preview.summary.total_records} record)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">SKU</th>
                                    <th className="px-6 py-4">Produk</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4 text-right">Qty</th>
                                    <th className="px-6 py-4 text-right">Harga</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4">Sumber</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                                {preview.data.map((trx, i) => (
                                    <tr key={i} className="hover:bg-brand-bg transition-colors">
                                        <td className="px-6 py-3 text-accent">{trx.transaction_date?.substring(0, 10)}</td>
                                        <td className="px-6 py-3 font-mono text-xs">{trx.product?.sku}</td>
                                        <td className="px-6 py-3 font-bold text-primary">{trx.product?.name}</td>
                                        <td className="px-6 py-3">
                                            <span className="bg-surface text-secondary px-2 py-0.5 rounded text-xs font-semibold border border-accent/20">
                                                {trx.product?.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">{trx.quantity_sold}</td>
                                        <td className="px-6 py-3 text-right text-accent">Rp {Number(trx.unit_price).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-3 text-right font-bold">Rp {Number(trx.total_amount).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-3 text-xs uppercase text-accent">{trx.source}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isOwner && (
                <div className="bg-surface/50 rounded-xl p-8 text-center border border-accent/10">
                    <FileText size={40} className="mx-auto text-accent mb-4" />
                    <p className="text-on-surface font-semibold">Sebagai Owner, Anda hanya dapat melihat ringkasan dan mengekspor laporan PDF summary.</p>
                    <p className="text-accent text-sm mt-2">Hubungi Admin untuk akses data transaksi lengkap.</p>
                </div>
            )}
        </div>
    );
}
