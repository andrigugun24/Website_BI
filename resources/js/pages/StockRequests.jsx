import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClipboardList, Plus, X, CheckCircle, XCircle, Clock, PlayCircle, ArrowDownCircle, ArrowUpCircle, ChevronRight, User } from 'lucide-react';
import Swal from 'sweetalert2';

export default function StockRequests() {
    const [requests, setRequests] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        type: 'in',
        quantity: 1,
        notes: ''
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role;

    // Role permissions
    const canApprove = role === 'owner';
    const canExecute = role === 'admin';
    const canCreateIn = role === 'admin' || role === 'manager';
    const canCreateOut = role === 'manager' || role === 'owner';
    const canCreate = canCreateIn || canCreateOut;

    // Default type based on role
    const getDefaultType = () => {
        if (canCreateIn && !canCreateOut) return 'in';
        if (canCreateOut && !canCreateIn) return 'out';
        return 'in'; // manager can do both, default to 'in'
    };

    const fetchData = async (p = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('per_page', 15);
            params.append('page', p);

            const result = await api.getStockRequests(params.toString());
            setRequests(result.data || []);
            setPage(result.current_page || 1);
            setLastPage(result.last_page || 1);
        } catch (e) {
            console.error("Fetch requests error", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.getProducts('is_active=1&per_page=1000');
            setProducts(res.data || res);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        fetchProducts();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.createStockRequest(formData);
            setIsModalOpen(false);
            fetchData(1);
            Swal.fire('Berhasil', 'Permintaan berhasil dibuat.', 'success');
        } catch (e) {
            Swal.fire('Gagal', e.response?.data?.message || 'Gagal membuat permintaan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleApproval = async (id, status) => {
        const label = status === 'approved' ? 'menyetujui' : 'menolak';
        const result = await Swal.fire({
            title: 'Konfirmasi',
            text: `Apakah Anda yakin ingin ${label} permintaan ini?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: status === 'approved' ? '#456254' : '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: `Ya, ${label}`,
            cancelButtonText: 'Batal'
        });
        if (!result.isConfirmed) return;

        try {
            await api.updateStockRequestStatus(id, { status });
            fetchData(page);
            Swal.fire('Berhasil', `Permintaan berhasil di${label}.`, 'success');
        } catch (e) {
            Swal.fire('Gagal', e.response?.data?.message || 'Gagal mengubah status.', 'error');
        }
    };

    const handleExecute = async (id) => {
        const result = await Swal.fire({
            title: 'Konfirmasi Eksekusi',
            text: 'Apakah Anda yakin ingin mengeksekusi permintaan ini? Stok produk akan langsung diperbarui.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#456254',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Ya, Eksekusi',
            cancelButtonText: 'Batal'
        });
        if (!result.isConfirmed) return;

        try {
            await api.executeStockRequest(id);
            fetchData(page);
            Swal.fire('Selesai', 'Permintaan stok telah dieksekusi.', 'success');
        } catch (e) {
            Swal.fire('Gagal', e.response?.data?.message || 'Gagal mengeksekusi permintaan.', 'error');
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><Clock size={11}/> Menunggu</span>;
            case 'approved':
                return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle size={11}/> Disetujui</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><XCircle size={11}/> Ditolak</span>;
            case 'completed':
                return <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle size={11}/> Selesai</span>;
            default: return null;
        }
    };

    const getTypeBadge = (type) => {
        if (type === 'in') {
            return (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 w-fit">
                    <ArrowDownCircle size={11}/> Masuk
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 w-fit">
                <ArrowUpCircle size={11}/> Keluar
            </span>
        );
    };

    // Status flow visualization
    const StatusFlow = ({ req }) => {
        const steps = req.type === 'in'
            ? [
                { label: 'Dibuat', done: true, actor: req.user?.name },
                { label: 'Approval', done: req.status !== 'pending', actor: req.approved_by_user?.name || req.approvedBy?.name, rejected: req.status === 'rejected' },
                { label: 'Eksekusi', done: req.status === 'completed', actor: req.executed_by_user?.name || req.executedBy?.name },
              ]
            : [
                { label: 'Diperintahkan', done: true, actor: req.user?.name },
                { label: 'Eksekusi', done: req.status === 'completed', actor: req.executed_by_user?.name || req.executedBy?.name },
              ];

        return (
            <div className="flex items-center gap-1">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <div className="flex flex-col items-center" title={step.actor ? `${step.label}: ${step.actor}` : step.label}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all ${
                                step.rejected
                                    ? 'border-red-400 bg-red-100 text-red-600'
                                    : step.done
                                        ? 'border-green-400 bg-green-100 text-green-600'
                                        : 'border-gray-300 bg-gray-100 text-gray-400'
                            }`}>
                                {step.rejected ? '✕' : step.done ? '✓' : i + 1}
                            </div>
                            <span className={`text-[8px] mt-0.5 font-bold ${step.rejected ? 'text-red-500' : step.done ? 'text-green-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <ChevronRight size={10} className={`mt-[-10px] ${step.done && !step.rejected ? 'text-green-400' : 'text-gray-300'}`} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Determine which actions are available for each request
    const getActions = (req) => {
        const actions = [];

        // Owner can approve/reject pending barang masuk
        if (canApprove && req.status === 'pending' && req.type === 'in') {
            actions.push(
                <button
                    key="approve"
                    onClick={() => handleApproval(req.id, 'approved')}
                    className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all hover:shadow-sm"
                    title="Setujui"
                >
                    <CheckCircle size={15}/>
                </button>,
                <button
                    key="reject"
                    onClick={() => handleApproval(req.id, 'rejected')}
                    className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all hover:shadow-sm"
                    title="Tolak"
                >
                    <XCircle size={15}/>
                </button>
            );
        }

        // Admin can execute approved requests (both in and out)
        if (canExecute && req.status === 'approved') {
            actions.push(
                <button
                    key="execute"
                    onClick={() => handleExecute(req.id)}
                    className="px-3 py-1.5 bg-[#456254] text-white rounded-lg hover:bg-[#384f44] transition-all text-[10px] font-bold flex items-center gap-1 hover:shadow-sm"
                    title="Eksekusi"
                >
                    <PlayCircle size={13}/> Eksekusi
                </button>
            );
        }

        return actions;
    };

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Permintaan Stok</h2>
                    <p className="text-accent font-medium mt-1">Kelola permintaan penambahan atau pengurangan stok barang</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => {
                            setFormData({ product_id: '', type: getDefaultType(), quantity: 1, notes: '' });
                            setIsModalOpen(true);
                        }}
                        className="bg-[#456254] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#384f44] transition-colors"
                    >
                        <Plus size={16} /> Buat Permintaan
                    </button>
                )}
            </div>

            {/* Role Info Banner */}
            <div className="bg-white rounded-xl p-4 border border-accent/10 shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={16} className="text-primary" />
                </div>
                <div>
                    <p className="text-xs font-bold text-primary">Peran Anda: <span className="uppercase tracking-wider">{role}</span></p>
                    <p className="text-[11px] text-accent mt-0.5">
                        {role === 'admin' && 'Anda dapat membuat permintaan barang masuk dan mengeksekusi semua permintaan yang sudah disetujui.'}
                        {role === 'manager' && 'Anda dapat membuat permintaan barang masuk (perlu approval Owner) dan barang keluar (langsung ke Admin).'}
                        {role === 'owner' && 'Anda dapat menyetujui/menolak permintaan barang masuk dan membuat perintah barang keluar.'}
                    </p>
                </div>
            </div>

            {/* Alur Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-accent/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowDownCircle size={18} className="text-emerald-600" />
                        <h4 className="font-bold text-sm text-primary">Alur Barang Masuk</h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-accent">
                        <span className="bg-surface px-2 py-1 rounded">Admin/Manager</span>
                        <ChevronRight size={10} />
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Owner Approve</span>
                        <ChevronRight size={10} />
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Admin Eksekusi</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-accent/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowUpCircle size={18} className="text-orange-600" />
                        <h4 className="font-bold text-sm text-primary">Alur Barang Keluar</h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-accent">
                        <span className="bg-surface px-2 py-1 rounded">Manager/Owner</span>
                        <ChevronRight size={10} />
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Admin Eksekusi</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-surface border-t-primary rounded-full animate-spin"></div>
                    </div>
                )}
                
                <div className="px-6 py-5 border-b border-accent/10 flex items-center gap-2 bg-surface/30">
                    <ClipboardList size={16} className="text-primary"/> 
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                        Daftar Permintaan
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Produk</th>
                                <th className="px-6 py-4">Tipe</th>
                                <th className="px-6 py-4 text-center">Jumlah</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4">Diajukan Oleh</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                            {requests.length === 0 && !loading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-accent">Tidak ada data permintaan stok.</td></tr>
                            ) : requests.map((req) => (
                                <tr key={req.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-primary">{new Date(req.created_at).toLocaleDateString('id-ID')}</p>
                                        <p className="text-[9px] text-accent">{new Date(req.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-on-surface">{req.product?.name}</p>
                                        <p className="text-xs text-accent font-mono">{req.product?.sku}</p>
                                        {req.notes && <p className="text-[10px] italic text-accent mt-1">"{req.notes}"</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getTypeBadge(req.type)}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-lg">{req.quantity}</td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(req.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusFlow req={req} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-accent">{req.user?.name}</p>
                                        {(req.approved_by_user?.name || req.approvedBy?.name) && (
                                            <p className="text-[9px] text-green-600 mt-0.5">✓ {req.approved_by_user?.name || req.approvedBy?.name}</p>
                                        )}
                                        {(req.executed_by_user?.name || req.executedBy?.name) && (
                                            <p className="text-[9px] text-blue-600 mt-0.5">⚡ {req.executed_by_user?.name || req.executedBy?.name}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getActions(req).length > 0 ? (
                                            <div className="flex items-center justify-center gap-2">
                                                {getActions(req)}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-accent">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {lastPage > 1 && (
                    <div className="px-6 py-4 border-t border-accent/10 flex items-center justify-between text-sm">
                        <button disabled={page === 1} onClick={() => fetchData(page - 1)} className="text-on-surface font-semibold px-4 py-2 border border-accent/20 rounded-lg disabled:opacity-30">
                            Sebelumnya
                        </button>
                        <span className="text-accent font-bold">Halaman {page} dari {lastPage}</span>
                        <button disabled={page === lastPage} onClick={() => fetchData(page + 1)} className="text-on-surface font-semibold px-4 py-2 border border-accent/20 rounded-lg disabled:opacity-30">
                            Selanjutnya
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-accent/10 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-accent/10 flex justify-between items-center bg-surface/50">
                            <h3 className="font-bold text-primary text-lg">Buat Permintaan Stok</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-accent hover:text-primary"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <form id="reqForm" onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Pilih Produk</label>
                                    <select required value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm">
                                        <option value="">-- Pilih Produk --</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (Stok: {p.current_stock})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Tipe</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({...formData, type: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm"
                                        >
                                            {canCreateIn && <option value="in">Barang Masuk (Tambah)</option>}
                                            {canCreateOut && <option value="out">Barang Keluar (Kurang)</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Jumlah</label>
                                        <input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm font-bold" />
                                    </div>
                                </div>

                                {/* Workflow hint */}
                                <div className="bg-surface/50 rounded-lg p-3 border border-accent/10">
                                    <p className="text-[10px] font-bold text-accent">
                                        {formData.type === 'in'
                                            ? '📦 Barang Masuk: Permintaan ini akan dikirim ke Owner untuk persetujuan terlebih dahulu, kemudian Admin akan mengeksekusi.'
                                            : '📤 Barang Keluar: Perintah ini akan langsung dikirim ke Admin untuk dieksekusi.'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Catatan (Opsional)</label>
                                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" rows="3" placeholder="Alasan permintaan..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-accent/10 flex gap-3 bg-surface/30">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-accent/20 text-accent hover:bg-surface">Batal</button>
                            <button type="submit" form="reqForm" disabled={saving || !formData.product_id} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-[#456254] text-white hover:bg-[#384f44] disabled:opacity-50">
                                {saving ? 'Memproses...' : 'Ajukan Permintaan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
