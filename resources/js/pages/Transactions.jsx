import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { FileText, Plus, X, Search, Calendar, Database, Upload, Download } from 'lucide-react';
import Swal from 'sweetalert2';

/* ───── Skeleton Components ───── */
const Shimmer = ({ className = '' }) => (
    <div className={`animate-shimmer rounded ${className}`} />
);

const SkeletonTransactionTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden min-h-[400px]">
        <div className="px-6 py-5 border-b border-accent/10 bg-surface/30 flex items-center gap-2">
            <Shimmer className="h-4 w-48" />
        </div>
        <div className="px-6 py-4 bg-surface/50 grid grid-cols-7 gap-4">
            {[...Array(7)].map((_,i) => <Shimmer key={i} className="h-3" />)}
        </div>
        {[...Array(8)].map((_,i) => (
            <div key={i} className="px-6 py-4 border-t border-accent/5 grid grid-cols-7 gap-4 items-center">
                <div className="space-y-1">
                    <Shimmer className="h-4 w-20" />
                    <Shimmer className="h-3 w-16" />
                </div>
                <Shimmer className="h-3 w-16" />
                <div className="space-y-1">
                    <Shimmer className="h-4 w-24" />
                    <Shimmer className="h-4 w-14 rounded" />
                </div>
                <Shimmer className="h-4 w-8 mx-auto" />
                <Shimmer className="h-4 w-20 ml-auto" />
                <Shimmer className="h-4 w-24 ml-auto" />
                <div className="flex items-center gap-2">
                    <Shimmer className="w-6 h-6 rounded-full" />
                    <Shimmer className="h-3 w-12" />
                </div>
            </div>
        ))}
    </div>
);

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]); // For modal dropdown
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    
    // Config page / meta
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '', transaction_date: new Date().toISOString().split('T')[0], 
        quantity_sold: 1, unit_price: 0, order_ref: ''
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const isOwner = user?.role === 'owner';

    const fileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);
        setImporting(true);

        try {
            await api.importTransactions(uploadData);
            Swal.fire('Berhasil', 'Transaksi berhasil diimpor.', 'success');
            fetchData(1);
        } catch (error) {
            Swal.fire('Gagal', error.response?.data?.message || 'Gagal mengimpor transaksi', 'error');
        } finally {
            setImporting(false);
            e.target.value = null; // reset
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await api.downloadTransactionTemplate();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_transaksi.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (e) {
            Swal.fire('Gagal', 'Tidak dapat mengunduh template', 'error');
        }
    };

    const fetchData = async (p = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('per_page', 20);
            params.append('page', p);

            const result = await api.getTransactions(params.toString());
            // Laravel paginator returns { data: [...], current_page: X, last_page: Y }
            setTransactions(result.data || []);
            setPage(result.current_page || 1);
            setLastPage(result.last_page || 1);
        } catch (e) {
            console.error("Transactions fetch error", e);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    const fetchProductsForSelect = async () => {
        try {
            // Get all active products for the dropdown
            const res = await api.getProducts('is_active=1&per_page=1000');
            setProducts(res.data || res);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        fetchProductsForSelect();
    }, []);

    const openModal = () => {
        setFormData({ 
            product_id: '', transaction_date: new Date().toISOString().split('T')[0], 
            quantity_sold: 1, unit_price: 0, order_ref: '' 
        });
        setIsModalOpen(true);
    };

    const handleProductSelect = (pid) => {
        const prod = products.find(p => p.id == pid);
        setFormData(f => ({ ...f, product_id: pid, unit_price: prod ? prod.price : 0 }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.product_id) return alert('Pilih produk');
        
        setSaving(true);
        try {
            await api.createTransaction(formData);
            setIsModalOpen(false);
            fetchData(1); // Return to first page to see the new transaction
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal menyimpan transaksi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Riwayat Transaksi</h2>
                    <p className="text-accent font-medium mt-1">Daftar penjualan harian dan manual entri</p>
                </div>
                {!isOwner && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadTemplate}
                            className="bg-surface text-primary px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-variant transition-colors border border-accent/20"
                            title="Download Template CSV"
                        >
                            <Download size={16} /> Template
                        </button>
                        <input 
                            type="file" 
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                            ref={fileInputRef} 
                            onChange={handleImport} 
                            style={{ display: 'none' }} 
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            disabled={importing}
                            className="bg-white border border-primary text-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface transition-colors disabled:opacity-50"
                        >
                            <Upload size={16} /> {importing ? 'Mengimpor...' : 'Import Excel'}
                        </button>
                        <button
                            onClick={openModal}
                            className="bg-[#456254] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#384f44] transition-colors"
                        >
                            <Plus size={16} /> Catat Penjualan Manual
                        </button>
                    </div>
                )}
            </div>

            {/* Skeleton Loading for Initial Load */}
            {initialLoad ? (
                <SkeletonTransactionTable />
            ) : (
            <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-surface border-t-primary rounded-full animate-spin"></div>
                    </div>
                )}
                
                <div className="px-6 py-5 border-b border-accent/10 flex items-center gap-2 bg-surface/30">
                    <Database size={16} className="text-primary"/> 
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                        Data Transaksi Terkini
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Tanggal / Waktu</th>
                                <th className="px-6 py-4">SKU Produk</th>
                                <th className="px-6 py-4">Nama Produk</th>
                                <th className="px-6 py-4 text-center">Qty</th>
                                <th className="px-6 py-4 text-right">Harga Satuan</th>
                                <th className="px-6 py-4 text-right">Total (Rp)</th>
                                <th className="px-6 py-4">Pencatat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                            {transactions.length === 0 && !loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-accent">Tidak ada data transaksi.</td></tr>
                            ) : transactions.map((trx) => (
                                <tr key={trx.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-primary">{trx.transaction_date.substring(0,10)}</p>
                                        <p className="text-xs text-accent mt-0.5 opacity-60">ID: {trx.id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-accent font-mono text-xs">{trx.product?.sku}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-on-surface">{trx.product?.name}</p>
                                        <span className="bg-surface text-secondary px-2 py-0.5 mt-1 rounded text-[10px] font-semibold border border-accent/20 inline-block">
                                            Ref: {trx.order_ref || trx.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold">{trx.quantity_sold}</td>
                                    <td className="px-6 py-4 text-right text-accent">
                                        Rp {Number(trx.unit_price).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-primary">
                                       Rp {Number(trx.total_amount).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-accent">
                                        <div className="flex items-center gap-2">
                                            {trx.source === 'manual' ? (
                                               <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] uppercase font-bold" title={trx.user?.name}>{trx.user?.name?.substring(0,2) || 'AD'}</span>
                                            ) : (
                                               <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-[10px] uppercase font-bold" title="Sistem">SYS</span>
                                            )}
                                            <span className="text-xs">{trx.source}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {lastPage > 1 && (
                    <div className="px-6 py-4 border-t border-accent/10 flex items-center justify-between text-sm">
                        <button 
                            disabled={page === 1}
                            onClick={() => fetchData(page - 1)}
                            className="text-on-surface font-semibold px-4 py-2 border border-accent/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface"
                        >
                            Sebelummya
                        </button>
                        <span className="text-accent font-bold">Halaman {page} dari {lastPage}</span>
                        <button 
                            disabled={page === lastPage}
                            onClick={() => fetchData(page + 1)}
                            className="text-on-surface font-semibold px-4 py-2 border border-accent/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface"
                        >
                            Selanjutnya
                        </button>
                    </div>
                )}
            </div>
            )}

            {/* Modal Input Transaction */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-accent/10 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-accent/10 flex justify-between items-center bg-surface/50">
                            <h3 className="font-bold text-primary text-lg flex items-center gap-2">Catat Penjualan Baru</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-accent hover:text-primary"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <form id="trxForm" onSubmit={handleSave} className="p-6 space-y-5">
                                <div>
                                    <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Pilih Produk (Tersedia: {products.length})</label>
                                    <select 
                                        required 
                                        value={formData.product_id}
                                        onChange={e => handleProductSelect(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white"
                                    >
                                        <option value="">-- Ketik mencari atau pilih --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Tanggal Transaksi</label>
                                        <input type="date" required value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">No Referensi / Nota</label>
                                        <input type="text" placeholder="Contoh: INV-001" value={formData.order_ref} onChange={e => setFormData({...formData, order_ref: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-surface rounded-lg border-l-4 border-primary">
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Jumlah Terjual (Qty)</label>
                                        <input type="number" required min="1" max="9999" value={formData.quantity_sold} onChange={e => setFormData({...formData, quantity_sold: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-xl font-bold font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Harga Jual Satuan (Rp)</label>
                                        <input type="number" required min="0" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm font-bold bg-white" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center px-2 py-4 border-b border-t border-accent/10 border-dashed">
                                     <span className="font-semibold text-accent uppercase text-xs tracking-wider">Total Pembayaran</span>
                                     <span className="text-2xl font-black text-primary">Rp {(formData.quantity_sold * formData.unit_price).toLocaleString('id-ID')}</span>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-accent/10 flex gap-3 bg-surface/30">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-accent/20 text-accent hover:bg-surface transition-colors">Batal</button>
                            <button type="submit" form="trxForm" disabled={saving || !formData.product_id} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-[#456254] text-white hover:bg-[#384f44] transition-colors disabled:opacity-50">
                                {saving ? 'Memproses...' : 'Catat Penjualan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
