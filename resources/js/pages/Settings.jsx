import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Building2, Bell, Shield, Eye, EyeOff, Check, Loader2, LogOut, Monitor, Clock, ListOrdered, FileText } from 'lucide-react';

const TABS = [
    { id: 'profile', label: 'Profil Pengguna', icon: User },
    { id: 'general', label: 'Pengaturan Umum', icon: Building2 },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'activity', label: 'Catatan Aktivitas', icon: ListOrdered },
];

const Toggle = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-4">
        <div>
            <p className="text-sm font-semibold text-on-surface">{label}</p>
            {description && <p className="text-xs text-accent mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#456254]' : 'bg-accent/30'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);

import { useLocation } from 'react-router-dom';

export default function Settings() {
    const location = useLocation();
    const queryTab = new URLSearchParams(location.search).get('tab');
    const activeTab = queryTab || 'profile';
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Profile state
    const [profileName, setProfileName] = useState(user.name || '');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState('');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwSaving, setPwSaving] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError] = useState('');

    // General settings
    const [generalSettings, setGeneralSettings] = useState({
        companyName: 'PT Tataruma BI',
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
        dateFormat: 'DD/MM/YYYY'
    });
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [generalSaving, setGeneralSaving] = useState(false); // Added for general settings save button

    useEffect(() => {
        if (activeTab === 'general') {
            fetchSettings();
        }
    }, [activeTab]);

    const fetchSettings = async () => {
        setLoadingSettings(true);
        try {
            const data = await api.getSettings();
            if (Object.keys(data).length > 0) {
                setGeneralSettings({
                    companyName: data.companyName || 'PT Tataruma BI',
                    currency: data.currency || 'IDR',
                    timezone: data.timezone || 'Asia/Jakarta',
                    dateFormat: data.dateFormat || 'DD/MM/YYYY'
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSettings(false);
        }
    };

    // Activity Logs
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logPage, setLogPage] = useState(1);
    const [logLastPage, setLogLastPage] = useState(1);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivityLogs(1);
        }
    }, [activeTab]);

    const fetchActivityLogs = async (p = logPage) => {
        setLoadingLogs(true);
        try {
            const res = await api.getActivityLogs(`page=${p}`);
            setActivityLogs(res.data?.data || res.data || res);
            setLogPage(res.data?.current_page || res.current_page || 1);
            setLogLastPage(res.data?.last_page || res.last_page || 1);
        } catch (e) {
            console.error('Fetch logs error', e);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleSaveGeneral = async () => {
        setGeneralSaving(true);
        try {
            await api.updateSettings(generalSettings);
            alert('Pengaturan umum berhasil disimpan ke server!');
        } catch (e) {
            alert(e.response?.data?.message || 'Gagal menyimpan pengaturan umum.');
        } finally {
            setGeneralSaving(false);
        }
    };

    // Notification settings (localStorage)
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('tataruma_notifications');
        return saved ? JSON.parse(saved) : {
            dailyReport: true,
            underperforming: true,
            minStock: false,
            weeklySummary: true,
        };
    });

    // Security state
    const [logoutAllLoading, setLogoutAllLoading] = useState(false);
    const [logoutAllSuccess, setLogoutAllSuccess] = useState(false);

    useEffect(() => {
        localStorage.setItem('tataruma_notifications', JSON.stringify(notifications));
    }, [notifications]);

    const handleProfileSave = async () => {
        setProfileSaving(true);
        setProfileError('');
        setProfileSuccess(false);
        try {
            await api.updateProfile({ name: profileName });
            const updatedUser = { ...user, name: profileName };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (e) {
            setProfileError(e.response?.data?.message || 'Gagal memperbarui profil.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setPwError('Kata sandi baru tidak cocok.');
            return;
        }
        if (newPassword.length < 8) {
            setPwError('Kata sandi minimal 8 karakter.');
            return;
        }
        setPwSaving(true);
        setPwError('');
        setPwSuccess(false);
        try {
            await api.changePassword({
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            setPwSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPwSuccess(false), 3000);
        } catch (e) {
            setPwError(e.response?.data?.message || 'Gagal mengubah kata sandi.');
        } finally {
            setPwSaving(false);
        }
    };

    const handleLogoutAll = async () => {
        setLogoutAllLoading(true);
        try {
            await api.logoutAll();
            setLogoutAllSuccess(true);
            setTimeout(() => setLogoutAllSuccess(false), 3000);
        } catch (e) {
            console.error('Logout all failed', e);
        } finally {
            setLogoutAllLoading(false);
        }
    };

    const InputField = ({ label, value, onChange, type = 'text', readOnly = false, placeholder, rightIcon }) => (
        <div className="mb-5">
            <label className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-2">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange?.(e.target.value)}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-on-surface transition-all border ${
                        readOnly
                            ? 'bg-surface border-accent/10 text-accent cursor-not-allowed'
                            : 'bg-white border-accent/20 focus:border-[#456254] focus:ring-2 focus:ring-[#456254]/10 outline-none'
                    }`}
                />
                {rightIcon && (
                    <button type="button" onClick={rightIcon.onClick} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-on-surface transition-colors">
                        {rightIcon.icon}
                    </button>
                )}
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                <h3 className="font-bold text-primary text-sm mb-5 flex items-center gap-2">
                    <User size={16} /> Informasi Profil
                </h3>
                <InputField label="Nama Lengkap" value={profileName} onChange={setProfileName} placeholder="Masukkan nama lengkap" />
                <InputField label="Email Perusahaan" value={user.email || ''} readOnly />
                <InputField label="Peran" value={user.role_name || user.role || ''} readOnly />

                {profileError && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4">{profileError}</p>}
                {profileSuccess && <p className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg mb-4 flex items-center gap-2"><Check size={14} /> Profil berhasil diperbarui.</p>}

                <button onClick={handleProfileSave} disabled={profileSaving || profileName === user.name}
                    className="bg-[#456254] text-white px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#384f44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Simpan Perubahan
                </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                <h3 className="font-bold text-primary text-sm mb-5 flex items-center gap-2">
                    <Shield size={16} /> Ubah Kata Sandi
                </h3>
                <InputField
                    label="Kata Sandi Saat Ini"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi saat ini"
                    rightIcon={{
                        onClick: () => setShowCurrentPw(!showCurrentPw),
                        icon: showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />,
                    }}
                />
                <InputField
                    label="Kata Sandi Baru"
                    value={newPassword}
                    onChange={setNewPassword}
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    rightIcon={{
                        onClick: () => setShowNewPw(!showNewPw),
                        icon: showNewPw ? <EyeOff size={16} /> : <Eye size={16} />,
                    }}
                />
                <InputField label="Konfirmasi Kata Sandi Baru" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Ulangi kata sandi baru" />

                {pwError && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4">{pwError}</p>}
                {pwSuccess && <p className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg mb-4 flex items-center gap-2"><Check size={14} /> Kata sandi berhasil diubah.</p>}

                <button onClick={handlePasswordChange} disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-[#456254] text-white px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#384f44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                    Ubah Kata Sandi
                </button>
            </div>
        </div>
    );

    const renderGeneral = () => {
        const isAdmin = user.role === 'admin';
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                <h3 className="font-bold text-primary text-sm mb-1 flex items-center gap-2">
                    <Building2 size={16} /> Konfigurasi Sistem
                </h3>
                <p className="text-xs text-accent mb-6">
                    {isAdmin ? 'Kelola pengaturan umum sistem.' : 'Hanya admin yang dapat mengubah pengaturan ini.'}
                </p>

                <InputField label="Nama Perusahaan" value={generalSettings.companyName}
                    onChange={v => isAdmin && setGeneralSettings({ ...generalSettings, companyName: v })} readOnly={!isAdmin} />

                <div className="mb-5">
                    <label className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-2">Mata Uang Default</label>
                    <select value={generalSettings.currency} disabled={!isAdmin}
                        onChange={e => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-on-surface border transition-all outline-none ${isAdmin ? 'bg-white border-accent/20 focus:border-[#456254]' : 'bg-surface border-accent/10 text-accent cursor-not-allowed'}`}>
                        <option value="IDR">IDR — Rupiah Indonesia</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="SGD">SGD — Singapore Dollar</option>
                    </select>
                </div>

                <div className="mb-5">
                    <label className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-2">Format Tanggal</label>
                    <select value={generalSettings.dateFormat} disabled={!isAdmin}
                        onChange={e => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-on-surface border transition-all outline-none ${isAdmin ? 'bg-white border-accent/20 focus:border-[#456254]' : 'bg-surface border-accent/10 text-accent cursor-not-allowed'}`}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                </div>

                <div className="mb-5">
                    <label className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-2">Zona Waktu</label>
                    <select value={generalSettings.timezone} disabled={!isAdmin}
                        onChange={e => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-on-surface border transition-all outline-none ${isAdmin ? 'bg-white border-accent/20 focus:border-[#456254]' : 'bg-surface border-accent/10 text-accent cursor-not-allowed'}`}>
                        <option value="Asia/Jakarta (WIB)">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar (WITA)">Asia/Makassar (WITA)</option>
                        <option value="Asia/Jayapura (WIT)">Asia/Jayapura (WIT)</option>
                    </select>
                </div>

                {isAdmin && (
                    <button onClick={handleSaveGeneral} disabled={generalSaving}
                        className="mt-4 bg-[#456254] text-white px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#384f44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {generalSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Simpan Pengaturan
                    </button>
                )}
            </div>
        );
    };

    const renderNotifications = () => (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
            <h3 className="font-bold text-primary text-sm mb-1 flex items-center gap-2">
                <Bell size={16} /> Preferensi Notifikasi
            </h3>
            <p className="text-xs text-accent mb-4">Atur notifikasi yang ingin Anda terima dari sistem.</p>

            <div className="divide-y divide-accent/10">
                <Toggle label="Email Laporan Harian" description="Terima ringkasan penjualan harian via email setiap pagi."
                    checked={notifications.dailyReport} onChange={v => setNotifications({ ...notifications, dailyReport: v })} />
                <Toggle label="Notifikasi Produk Underperforming" description="Peringatan saat produk menunjukkan tren penurunan berturut-turut."
                    checked={notifications.underperforming} onChange={v => setNotifications({ ...notifications, underperforming: v })} />
                <Toggle label="Peringatan Stok Minimum" description="Notifikasi saat stok produk mencapai batas minimum."
                    checked={notifications.minStock} onChange={v => setNotifications({ ...notifications, minStock: v })} />
                <Toggle label="Ringkasan Performa Mingguan" description="Laporan perbandingan performa mingguan dikirim setiap Senin."
                    checked={notifications.weeklySummary} onChange={v => setNotifications({ ...notifications, weeklySummary: v })} />
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                <h3 className="font-bold text-primary text-sm mb-5 flex items-center gap-2">
                    <Monitor size={16} /> Sesi Aktif
                </h3>
                <div className="bg-surface rounded-lg p-4 flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#456254]/10 flex items-center justify-center">
                        <Monitor size={20} className="text-[#456254]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-on-surface">Perangkat Ini</p>
                        <p className="text-xs text-accent">Sesi saat ini — Aktif</p>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">AKTIF</span>
                </div>

                <div className="bg-surface rounded-lg p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Clock size={20} className="text-accent" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-on-surface">Login Terakhir</p>
                        <p className="text-xs text-accent">{new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                <h3 className="font-bold text-primary text-sm mb-2 flex items-center gap-2">
                    <LogOut size={16} /> Keluar dari Semua Perangkat
                </h3>
                <p className="text-xs text-accent mb-5">
                    Tindakan ini akan menghapus semua token sesi dan memaksa login ulang di seluruh perangkat. Perangkat ini tidak terpengaruh.
                </p>

                {logoutAllSuccess && <p className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg mb-4 flex items-center gap-2"><Check size={14} /> Semua sesi lain berhasil dihapus.</p>}

                <button onClick={handleLogoutAll} disabled={logoutAllLoading}
                    className="bg-red-50 text-red-700 border border-red-200 px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50">
                    {logoutAllLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                    Keluar dari Semua Perangkat Lain
                </button>
            </div>
        </div>
    );

    const renderActivityLogs = () => {
        const isAdmin = user.role === 'admin' || user.role === 'owner';
        if (!isAdmin) {
            return (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-accent/10 text-center text-accent">
                    Akses ditolak. Hanya Admin dan Owner yang dapat melihat histori log aktivitas sistem.
                </div>
            );
        }
        
        return (
            <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden flex flex-col h-full min-h-[500px]">
                <div className="px-6 py-5 border-b border-accent/10 bg-surface/30">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                        <FileText size={16} /> Audit Log Aktivitas Sistem
                    </h3>
                    <p className="text-xs text-accent mt-1">Lacak tindakan yang dilakukan oleh pengguna.</p>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                    {loadingLogs ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="w-8 h-8 border-4 border-surface border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : activityLogs.length === 0 ? (
                        <div className="p-12 text-center text-accent text-sm">Belum ada catatan aktivitas.</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-surface/50 text-accent text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4">Pengguna</th>
                                    <th className="px-6 py-4">Aksi</th>
                                    <th className="px-6 py-4">Target / Modul</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                                {activityLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-brand-bg transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-accent">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-3 font-semibold text-primary">{log.user ? `${log.user.name} (${log.user.role?.slug || 'user'})` : 'Sistem'}</td>
                                        <td className="px-6 py-3">
                                            <span className="bg-surface border border-accent/10 px-2 py-0.5 rounded text-xs text-secondary font-mono">{log.action}</span>
                                        </td>
                                        <td className="px-6 py-3 font-semibold text-accent text-xs uppercase">{log.resource || '-'}</td>
                                        <td className="px-6 py-3 hidden md:table-cell text-xs text-accent max-w-xs truncate overflow-hidden">
                                            {log.details ? JSON.stringify(log.details) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* Pagination */}
                {logLastPage > 1 && (
                    <div className="px-6 py-4 border-t border-accent/10 flex items-center justify-between text-sm bg-surface/30">
                        <button disabled={logPage === 1} onClick={() => fetchActivityLogs(logPage - 1)}
                            className="text-on-surface font-semibold px-4 py-2 border border-accent/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface bg-white">
                            Sebelumnya
                        </button>
                        <span className="text-secondary font-bold text-xs">Hal {logPage} dari {logLastPage}</span>
                        <button disabled={logPage === logLastPage} onClick={() => fetchActivityLogs(logPage + 1)}
                            className="text-on-surface font-semibold px-4 py-2 border border-accent/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface bg-white">
                            Selanjutnya
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return renderProfile();
            case 'general': return renderGeneral();
            case 'notifications': return renderNotifications();
            case 'security': return renderSecurity();
            case 'activity': return renderActivityLogs();
            default: return null;
        }
    };

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Pengaturan</h2>
                <p className="text-accent font-medium mt-1">Kelola profil dan konfigurasi sistem Anda.</p>
            </div>

            {/* Content with tab navigation */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Right content */}
                <div className="flex-1 min-w-0">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
