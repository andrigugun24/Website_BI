import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Package, Plus, Edit2, Trash2, X, Search, Filter, Eye, History, TrendingUp } from 'lucide-react';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: null, sku: '', name: '', category: '', price: 0, 
        current_stock: 0, min_stock_threshold: 0, is_active: true
    });

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [productDetail, setProductDetail] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));
    const isOwner = user?.role === 'owner';

    const fetchData = async (p = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', p);
            params.append('per_page', 10);
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory) params.append('category', selectedCategory);

            const [prodRes, catRes] = await Promise.all([
                api.getProducts(params.toString()),
                api.getCategories()
            ]);
            
            setProducts(prodRes.data || prodRes);
            setPage(prodRes.current_page || 1);
            setLastPage(prodRes.last_page || 1);
            setCategories(catRes);
        } catch (e) {
            console.error("Products fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData(1);
        }, 300); // debounce search
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedCategory]);

    const openModal = (product = null) => {
        if (product) {
            setFormData({
                id: product.id, sku: product.sku, name: product.name, 
                category: product.category || '', price: product.price, 
                current_stock: product.current_stock, 
                min_stock_threshold: product.min_stock_threshold || 0,
                is_active: product.is_active
            });
        } else {
            setFormData({ 
                id: null, sku: '', name: '', category: '', price: 0, 
                current_stock: 0, min_stock_threshold: 10, is_active: true 
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (formData.id) {
                await api.updateProduct(formData.id, formData);
            } else {
                await api.createProduct(formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal menyimpan produk');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product) => {
        if (!confirm(`Yakin ingin menonaktifkan produk ${product.name}?`)) return;
        try {
            await api.deleteProduct(product.id);
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal menonaktifkan produk');
        }
    };

    const openDetail = async (product) => {
        setDetailModalOpen(true);
        setProductDetail(null);
        try {
            const res = await api.getProduct(product.id);
            setProductDetail({
                ...res.product,
                trend_analysis: res.latest_trend,
                transactions: res.product?.transactions || []
            });
        } catch (e) {
            alert('Gagal memuat detail produk');
        }
    };

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Katalog Produk</h2>
                    <p className="text-accent font-medium mt-1">Daftar inventaris dan harga saat ini</p>
                </div>
                {!isOwner && (
                    <button
                        onClick={() => openModal()}
                        className="bg-[#456254] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#384f44] transition-colors"
                    >
                        <Plus size={16} /> Tambah Produk
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-accent/10 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau SKU..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm"
                    />
                </div>
                <div className="w-full md:w-64 relative">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white appearance-none cursor-pointer"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-surface border-t-primary rounded-full animate-spin"></div>
                    </div>
                )}
                <div className="px-6 py-5 border-b border-accent/10 flex justify-between items-center bg-surface/30">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                        <Package size={16} /> Total: {products.length} Produk ditampilkan
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Produk</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4 text-right">Harga Satuan</th>
                                <th className="px-6 py-4 text-right">Stok</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                {!isOwner && <th className="px-6 py-4 text-right">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                            {products.length === 0 && !loading ? (
                                <tr><td colSpan={isOwner ? 6 : 7} className="px-6 py-12 text-center text-accent">Tidak ada produk ditemukan.</td></tr>
                            ) : products.map((prod) => (
                                <tr key={prod.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-6 py-4 font-bold text-primary">{prod.name}</td>
                                    <td className="px-6 py-4 text-accent">{prod.sku}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-surface font-semibold text-secondary px-2 py-1 rounded text-xs border border-accent/20">
                                            {prod.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-on-surface">
                                        Rp {Number(prod.price).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`${prod.current_stock <= prod.min_stock_threshold ? 'text-red-600 font-bold' : ''}`}>
                                            {prod.current_stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {prod.is_active ? (
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">AKTIF</span>
                                        ) : (
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">NONAKTIF</span>
                                        )}
                                    </td>
                                    {!isOwner && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openDetail(prod)} className="p-2 text-primary hover:text-[#2a3c33] transition-colors bg-brand-bg rounded hover:bg-surface" title="Lihat Detail">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => openModal(prod)} className="p-2 text-accent hover:text-primary transition-colors bg-surface rounded hover:bg-surface-variant" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                {prod.is_active && (
                                                    <button onClick={() => handleDelete(prod)} className="p-2 text-red-400 hover:text-red-700 transition-colors bg-red-50 rounded hover:bg-red-100" title="Nonaktifkan">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
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
                            Sebelumnya
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

            {/* Modal Detail View */}
            {detailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-accent/10 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-accent/10 flex justify-between items-center bg-surface/50">
                            <h3 className="font-bold text-primary text-lg flex items-center gap-2">Detail Produk</h3>
                            <button onClick={() => setDetailModalOpen(false)} className="text-accent hover:text-primary"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6">
                            {!productDetail ? (
                                <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-surface border-t-primary rounded-full animate-spin"></div></div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex gap-4 p-4 border rounded-xl border-accent/20 shadow-sm">
                                        <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center text-primary">
                                            <Package size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-primary">{productDetail.name}</h4>
                                            <p className="text-sm font-mono text-accent">{productDetail.sku} • {productDetail.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-accent uppercase font-bold tracking-wider">Harga Satuan</p>
                                            <p className="text-xl font-bold text-primary">Rp {Number(productDetail.price).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-surface/50 rounded-xl border border-accent/10">
                                            <p className="text-xs text-accent font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Package size={12}/> Stok Tersedia</p>
                                            <p className={`text-2xl font-black ${productDetail.current_stock <= productDetail.min_stock_threshold ? 'text-red-600' : 'text-primary'}`}>
                                                {productDetail.current_stock} <span className="text-sm font-medium text-accent">unit</span>
                                            </p>
                                            <p className="text-xs text-accent mt-1">Status: {productDetail.is_active ? 'Aktif' : 'Non-aktif'}</p>
                                        </div>
                                        <div className="p-4 bg-surface/50 rounded-xl border border-accent/10">
                                            <p className="text-xs text-accent font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={12}/> Identifikasi Tren</p>
                                            {productDetail.trend_analysis ? (
                                                <>
                                                    <p className={`text-2xl font-black ${productDetail.trend_analysis.is_underperforming ? 'text-red-600' : 'text-green-600'}`}>
                                                        {productDetail.trend_analysis.trend_ratio}%
                                                    </p>
                                                    <p className="text-xs text-accent mt-1">Dibanding periode dasar</p>
                                                </>
                                            ) : (
                                                <p className="text-sm font-medium text-accent italic mt-2">Belum ada data tren</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-primary text-sm flex items-center gap-2 mb-3"><History size={16}/> Transaksi Terakhir</h4>
                                        <div className="border border-accent/10 rounded-lg overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-surface/50 text-accent text-[10px] uppercase font-bold">
                                                    <tr>
                                                        <th className="px-4 py-2">Tanggal</th>
                                                        <th className="px-4 py-2 text-right">Qty</th>
                                                        <th className="px-4 py-2 text-right">Total</th>
                                                        <th className="px-4 py-2">Sumber</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-accent/10">
                                                    {!productDetail.transactions?.length ? (
                                                        <tr><td colSpan="4" className="px-4 py-4 text-center text-accent text-xs">Belum ada transaksi</td></tr>
                                                    ) : productDetail.transactions.map((trx) => (
                                                        <tr key={trx.id} className="hover:bg-brand-bg">
                                                            <td className="px-4 py-2">{trx.transaction_date.substring(0,10)}</td>
                                                            <td className="px-4 py-2 text-right font-bold">{trx.quantity_sold}</td>
                                                            <td className="px-4 py-2 text-right">Rp {Number(trx.total_amount).toLocaleString('id-ID')}</td>
                                                            <td className="px-4 py-2 text-xs uppercase text-accent border-l border-accent/5">{trx.source}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-accent/10 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-accent/10 flex justify-between items-center bg-surface/50">
                            <h3 className="font-bold text-primary text-lg">{formData.id ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-accent hover:text-primary"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <form id="productForm" onSubmit={handleSave} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Nama Produk</label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" placeholder="Contoh: Kemeja Flanel" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">SKU</label>
                                        <input type="text" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm uppercase" placeholder="KODE-123" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Kategori / Divisi</label>
                                        <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" placeholder="Contoh: Pakaian Pria" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Harga Dasar (Rp)</label>
                                        <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-surface p-4 rounded-lg mt-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Stok Saat Ini (Unit)</label>
                                        <input type="number" required min="0" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-red-700 uppercase block mb-1.5">Batas Minimum Stok</label>
                                        <input type="number" required min="0" value={formData.min_stock_threshold} onChange={e => setFormData({...formData, min_stock_threshold: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-red-200 focus:border-red-400 outline-none text-sm bg-white" />
                                    </div>
                                </div>
                                {formData.id && (
                                    <div className="flex items-center justify-between pt-4 border-t border-accent/10 mt-4">
                                        <label className="text-sm font-semibold text-on-surface">Status Produk (Ditampilkan / Dijual)</label>
                                        <button type="button" onClick={() => setFormData({...formData, is_active: !formData.is_active})} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${formData.is_active ? 'bg-primary' : 'bg-accent/30'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-accent/10 flex gap-3 bg-surface/30">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-accent/20 text-accent hover:bg-surface transition-colors">Batal</button>
                            <button type="submit" form="productForm" disabled={saving} className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-primary text-white hover:bg-[#384f44] transition-colors disabled:opacity-50">
                                {saving ? 'Menyimpan...' : 'Simpan Produk'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
