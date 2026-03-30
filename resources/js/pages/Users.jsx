import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users as UsersIcon, Plus, Edit2, Shield, Trash2, X, Check } from 'lucide-react';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null, name: '', email: '', password: '', role_id: '', is_active: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.getUsers(),
                api.getRoles()
            ]);
            setUsers(usersRes);
            setRoles(rolesRes);
        } catch (e) {
            console.error("Fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = (user = null) => {
        if (user) {
            setFormData({
                id: user.id, name: user.name, email: user.email, 
                password: '', role_id: user.role_id, is_active: user.is_active
            });
        } else {
            setFormData({ id: null, name: '', email: '', password: '', role_id: roles[0]?.id || '', is_active: true });
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
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal menyimpan pengguna');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`Yakin ingin menonaktifkan pengguna ${user.name}?`)) return;
        try {
            await api.deleteUser(user.id);
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal menonaktifkan pengguna');
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-surface border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Manajemen Pengguna</h2>
                    <p className="text-accent font-medium mt-1">Kelola akses dan akun anggota tim</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-[#456254] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#384f44] transition-colors"
                >
                    <Plus size={16} /> Tambah Pengguna
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
                <div className="px-6 py-5 border-b border-accent/10 flex justify-between items-center bg-surface/30">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                        <UsersIcon size={16} /> Daftar Pengguna ({users.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Nama Lengkap</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-primary">{user.name}</p>
                                        <p className="text-xs text-accent">{user.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-surface text-secondary px-2.5 py-1 rounded text-xs font-semibold border border-accent/20 flex w-fit items-center gap-1.5">
                                            <Shield size={12} /> {user.role?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">AKTIF</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">NONAKTIF</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openModal(user)} className="p-2 text-accent hover:text-primary transition-colors bg-surface rounded hover:bg-surface-variant">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(user)} className="p-2 text-red-400 hover:text-red-700 transition-colors bg-red-50 rounded hover:bg-red-100">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-accent/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-accent/10 flex justify-between items-center bg-surface/50">
                            <h3 className="font-bold text-primary text-lg">{formData.id ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-accent hover:text-primary"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Nama Lengkap</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Email</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">{formData.id ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi'}</label>
                                <input type={formData.id ? "text" : "password"} required={!formData.id} minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-accent uppercase block mb-1.5">Role</label>
                                    <select value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white">
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center justify-between pt-6">
                                    <label className="text-sm font-semibold text-on-surface">Status Aktif</label>
                                    <button type="button" onClick={() => setFormData({...formData, is_active: !formData.is_active})} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${formData.is_active ? 'bg-primary' : 'bg-accent/30'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-accent/20 text-accent hover:bg-surface">Batal</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-primary text-white hover:bg-[#384f44] disabled:opacity-50">
                                    {saving ? 'Loading...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
