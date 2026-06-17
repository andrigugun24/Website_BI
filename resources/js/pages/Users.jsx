import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users as UsersIcon, Plus, Edit2, Trash2, X, UserPlus, Shield, UserCheck, UserX, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

/* ───── Skeleton Components ───── */
const Shimmer = ({ className = '' }) => (
    <div className={`animate-shimmer rounded ${className}`} />
);

const SkeletonUserTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-accent/10 bg-surface/30 flex justify-between items-center">
            <Shimmer className="h-4 w-48" />
        </div>
        <div className="px-6 py-4 bg-surface/50 grid grid-cols-6 gap-4">
            {[...Array(6)].map((_,i) => <Shimmer key={i} className="h-3" />)}
        </div>
        {[...Array(5)].map((_,i) => (
            <div key={i} className="px-6 py-4 border-t border-accent/5 grid grid-cols-6 gap-4 items-center">
                <div className="flex items-center gap-3">
                    <Shimmer className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                        <Shimmer className="h-4 w-24" />
                        <Shimmer className="h-3 w-32" />
                    </div>
                </div>
                <Shimmer className="h-5 w-20 rounded-full" />
                <Shimmer className="h-5 w-16 rounded-full mx-auto" />
                <Shimmer className="h-3 w-24" />
                <div className="flex justify-end gap-2">
                    <Shimmer className="h-8 w-8 rounded" />
                    <Shimmer className="h-8 w-8 rounded" />
                    <Shimmer className="h-8 w-8 rounded" />
                </div>
            </div>
        ))}
    </div>
);

export default function Users() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        id: null, name: '', email: '', password: '', role_id: '', is_active: true,
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.getUsers(),
                api.getRoles()
            ]);
            setUsers(usersRes);
            setRoles(rolesRes);
        } catch (e) {
            console.error("Users fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openModal = (user = null) => {
        if (user) {
            setFormData({
                id: user.id, name: user.name, email: user.email, 
                password: '', role_id: user.role_id, is_active: user.is_active
            });
        } else {
            setFormData({ id: null, name: '', email: '', password: '', role_id: '', is_active: true });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (formData.id) {
                await api.updateUser(formData.id, formData);
            } else {
                await api.createUser(formData);
            }
            setIsModalOpen(false);
            fetchUsers();
            Swal.fire({
                icon: 'success',
                title: formData.id ? 'Berhasil Diperbarui' : 'Pengguna Ditambahkan',
                text: formData.id ? `Data ${formData.name} berhasil diperbarui.` : `${formData.name} berhasil ditambahkan ke sistem.`,
                confirmButtonColor: '#456254',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: e.response?.data?.message || 'Gagal menyimpan pengguna',
                confirmButtonColor: '#456254',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        const result = await Swal.fire({
            title: 'Hapus Pengguna?',
            html: `
                <div class="text-sm text-gray-600">
                    <p>Pengguna <strong>"${user.name}"</strong> (${user.email}) akan dihapus dari sistem.</p>
                    <p class="mt-2 text-xs text-gray-400">Jika pengguna memiliki riwayat transaksi, akun akan dinonaktifkan tanpa dihapus.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            focusCancel: true,
        });

        if (!result.isConfirmed) return;

        try {
            const res = await api.deleteUser(user.id);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: res.message || `Pengguna "${user.name}" telah dihapus.`,
                confirmButtonColor: '#456254',
                timer: 2000,
                showConfirmButton: false,
            });
            fetchUsers();
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: e.response?.data?.message || 'Gagal menghapus pengguna',
                confirmButtonColor: '#456254',
            });
        }
    };

    const handleToggleActive = async (user) => {
        const activeText = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
        const result = await Swal.fire({
            title: `${user.is_active ? 'Nonaktifkan' : 'Aktifkan'} Pengguna?`,
            html: `<p class="text-sm text-gray-600">Anda akan ${activeText} akun <strong>${user.name}</strong>.</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: user.is_active ? '#f59e0b' : '#22c55e',
            cancelButtonColor: '#6b7280',
            confirmButtonText: user.is_active ? 'Nonaktifkan' : 'Aktifkan',
            cancelButtonText: 'Batal',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            await api.updateUser(user.id, { is_active: !user.is_active });
            fetchUsers();
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Gagal mengubah status pengguna',
                confirmButtonColor: '#456254',
            });
        }
    };

    const currentUser = JSON.parse(localStorage.getItem('user'));

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Manajemen Pengguna</h2>
                    <p className="text-accent font-medium mt-1">Atur akses dan peran pengguna sistem</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-[#456254] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#384f44] transition-colors"
                >
                    <UserPlus size={16} /> Tambah Pengguna
                </button>
            </div>

            {/* Skeleton Loading */}
            {loading ? (
                <SkeletonUserTable />
            ) : (
            <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
                <div className="px-6 py-5 border-b border-accent/10 flex justify-between items-center bg-surface/30">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                        <UsersIcon size={16} /> {users.length} Pengguna Terdaftar
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Pengguna</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Dibuat</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                            {users.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-accent">Tidak ada pengguna.</td></tr>
                            ) : users.map((u) => (
                                <tr key={u.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${u.is_active ? 'bg-primary' : 'bg-accent/40'}`}>
                                                {u.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-primary">{u.name}</p>
                                                <p className="text-xs text-accent">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-surface font-semibold text-secondary px-2.5 py-1 rounded-full text-[10px] border border-accent/20 flex items-center gap-1 w-fit">
                                            <Shield size={10} /> {u.role?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {u.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                                <UserCheck size={10}/> AKTIF
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                                <UserX size={10}/> NONAKTIF
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-accent text-xs">
                                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openModal(u)} className="p-2 text-accent hover:text-primary transition-colors bg-surface rounded hover:bg-cream" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            {u.id !== currentUser?.id && (
                                                <>
                                                    <button 
                                                        onClick={() => handleToggleActive(u)} 
                                                        className={`p-2 rounded transition-colors ${u.is_active ? 'text-orange-400 hover:text-orange-700 bg-orange-50 hover:bg-orange-100' : 'text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100'}`}
                                                        title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    >
                                                        {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                                    </button>
                                                    <button onClick={() => handleDelete(u)} className="p-2 text-red-400 hover:text-red-700 transition-colors bg-red-50 rounded hover:bg-red-100" title="Hapus">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-accent/10 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-accent/10 flex justify-between items-center bg-surface/50">
                            <h3 className="font-bold text-primary text-lg flex items-center gap-2">
                                {formData.id ? <Edit2 size={18}/> : <UserPlus size={18}/>}
                                {formData.id ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-accent hover:text-primary"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <form id="userForm" onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Nama Lengkap</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" placeholder="Nama lengkap" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Email</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" placeholder="user@example.com" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">
                                        Kata Sandi {formData.id && <span className="text-accent/70 normal-case">(kosongkan jika tidak diubah)</span>}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            {...(!formData.id && {required: true})} 
                                            minLength={8} 
                                            value={formData.password} 
                                            onChange={e => setFormData({...formData, password: e.target.value})} 
                                            className="w-full px-4 py-2.5 pr-10 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm text-[#2a2a2a]" 
                                            placeholder="Minimal 8 karakter" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 px-3 text-[#8c827a] hover:text-[#456254] transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Role / Peran</label>
                                    <select required value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white">
                                        <option value="">-- Pilih Role --</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {formData.id && (
                                    <div className="flex items-center justify-between pt-4 border-t border-accent/10">
                                        <label className="text-sm font-semibold text-on-surface">Status Aktif</label>
                                        <button type="button" onClick={() => setFormData({...formData, is_active: !formData.is_active})} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${formData.is_active ? 'bg-primary' : 'bg-accent/30'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-accent/10 flex gap-3 bg-surface/30">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-accent/20 text-accent hover:bg-surface transition-colors">Batal</button>
                            <button type="submit" form="userForm" disabled={saving} className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-primary text-white hover:bg-[#384f44] transition-colors disabled:opacity-50">
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
