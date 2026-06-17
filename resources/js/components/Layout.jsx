import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Package, FileText, Database, Settings, LogOut, Users, CreditCard, ChevronDown, ChevronRight, Bell, User, Building2, Shield, ListOrdered, Menu, X, ClipboardList } from 'lucide-react';
import { api } from '../services/api';

const NavItem = ({ to, icon: Icon, label, disabled = false }) => {
    const location = useLocation();
    
    if (disabled) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 text-accent hover:bg-white/50 rounded-lg transition-all cursor-not-allowed opacity-60">
                <Icon size={20} />
                <span className="text-sm font-medium">{label} (Segera)</span>
            </div>
        );
    }

    return (
        <NavLink 
            to={to} 
            className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive || (to.startsWith('/settings') && location.pathname.startsWith('/settings'))
                    ? 'bg-white text-primary shadow-sm font-semibold' 
                    : 'text-on-surface hover:bg-white/50 font-medium'
                }`
            }
        >
            <Icon size={20} />
            <span className="text-sm">{label}</span>
        </NavLink>
    );
};

const NavDropdown = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isSettingsActive = location.pathname.startsWith('/settings');
    const [isOpen, setIsOpen] = useState(isSettingsActive);

    useEffect(() => {
        if (isSettingsActive) setIsOpen(true);
        else setIsOpen(false);
    }, [isSettingsActive]);

    return (
        <div className="rounded-lg transition-all">
            <button 
                onClick={() => {
                    if (isSettingsActive) {
                        setIsOpen(!isOpen);
                    } else {
                        navigate('/settings');
                    }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer rounded-lg transition-all ${isSettingsActive ? 'bg-white text-primary shadow-sm font-semibold' : 'text-on-surface hover:bg-white/50 font-medium'}`}
            >
                <div className="flex items-center gap-3">
                    <Settings size={20} />
                    <span className="text-sm">Pengaturan</span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {isOpen && (
                <div className="flex flex-col gap-1 pb-2 px-2 mt-1">
                    <NavLink to="/settings?tab=profile" className={({isActive}) => `flex items-center gap-3 px-4 py-2 mt-1 rounded-md text-sm transition-colors ${location.search === '?tab=profile' || location.search === '' ? 'bg-[#ede5ce] text-primary font-bold' : 'text-accent hover:text-primary hover:bg-surface/50'}`}>
                        <User size={14} /> Profil Pengguna
                    </NavLink>
                    <NavLink to="/settings?tab=general" className={({isActive}) => `flex items-center gap-3 px-4 py-2 mt-1 rounded-md text-sm transition-colors ${location.search === '?tab=general' ? 'bg-[#ede5ce] text-primary font-bold' : 'text-accent hover:text-primary hover:bg-surface/50'}`}>
                        <Building2 size={14} /> Pengaturan Umum
                    </NavLink>
                    <NavLink to="/settings?tab=notifications" className={({isActive}) => `flex items-center gap-3 px-4 py-2 mt-1 rounded-md text-sm transition-colors ${location.search === '?tab=notifications' ? 'bg-[#ede5ce] text-primary font-bold' : 'text-accent hover:text-primary hover:bg-surface/50'}`}>
                        <Bell size={14} /> Notifikasi
                    </NavLink>
                    <NavLink to="/settings?tab=security" className={({isActive}) => `flex items-center gap-3 px-4 py-2 mt-1 rounded-md text-sm transition-colors ${location.search === '?tab=security' ? 'bg-[#ede5ce] text-primary font-bold' : 'text-accent hover:text-primary hover:bg-surface/50'}`}>
                        <Shield size={14} /> Keamanan
                    </NavLink>
                    {user?.role === 'admin' && (
                        <NavLink to="/settings?tab=activity" className={({isActive}) => `flex items-center gap-3 px-4 py-2 mt-1 rounded-md text-sm transition-colors ${location.search === '?tab=activity' ? 'bg-[#ede5ce] text-primary font-bold' : 'text-accent hover:text-primary hover:bg-surface/50'}`}>
                            <ListOrdered size={14} /> Audit Log
                        </NavLink>
                    )}
                </div>
            )}
        </div>
    );
};

export default function Layout({ children }) {
    const navigate = useNavigate();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

    useEffect(() => {
        if (user && user.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            const data = await api.getNotifications();
            if (data && data.notifications) {
                setNotifications(data.notifications);
            } else {
                setNotifications([]);
            }
        } catch (e) {
            console.error('Failed to fetch notifications');
            setNotifications([]);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) { }
    };

    const markAllAsRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (e) { }
    };

    const handleLogout = async () => {
        await api.logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-brand-bg font-sans">
            {/* Sidebar Desktop */}
            <aside className="fixed left-0 top-0 h-screen w-72 bg-surface flex-col p-6 gap-y-2 hidden md:flex z-50 shadow-sm border-r border-accent/10">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <span className="font-sans font-extrabold text-[#708F7F] text-[28px] tracking-tighter lowercase drop-shadow-sm">tataruma</span>
                </div>

                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1 pb-4">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard Utama" />
                    <NavItem to="/trend" icon={TrendingUp} label="Analisis Tren" />
                    <NavItem to="/products" icon={Package} label="Produk" />
                    <NavItem to="/stock-requests" icon={ClipboardList} label="Permintaan Stok" />
                    <NavItem to="/transactions" icon={CreditCard} label="Transaksi" />
                    <NavItem to="/reports" icon={FileText} label="Pelaporan" />
                    {user?.role === 'admin' && (
                        <>
                            <NavItem to="/users" icon={Users} label="Manajemen Pengguna" />
                            <NavItem to="/data" icon={Database} label="Manajemen Data" />
                        </>
                    )}
                    <NavDropdown user={user} />
                </nav>

                <div className="mt-auto pt-6 border-t border-accent/20">
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-white text-on-surface border border-accent/20 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-surface active:scale-95 transition-all mb-2"
                    >
                        <LogOut size={16} className="text-secondary" />
                        <span className="text-sm">Log Out</span>
                    </button>

                </div>
            </aside>

            {/* Main Content Area */}
            <main className="md:ml-72 flex flex-col min-h-screen w-full">
                {/* TopAppBar */}
                <header className="bg-brand-bg flex justify-between items-center w-full px-6 md:px-10 py-4 h-20 sticky top-0 z-40 border-b border-accent/10 md:border-none backdrop-blur-md bg-opacity-80">
                    <div className="flex items-center gap-4">
                        <span className="font-sans font-extrabold text-[#708F7F] text-[28px] tracking-tighter lowercase drop-shadow-sm md:hidden">tataruma</span>
                        <div className="hidden lg:flex items-center gap-6 h-full">
                            <span className="text-on-surface font-semibold text-lg">{user?.role_name || 'Panel'}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-accent hover:text-primary transition-colors bg-white rounded-full shadow-sm hover:shadow-md border border-accent/10"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-accent/10 z-50 overflow-hidden transform origin-top-right transition-all">
                                    <div className="p-4 border-b border-accent/10 flex items-center justify-between bg-brand-bg/50 backdrop-blur-sm">
                                        <h3 className="font-bold text-primary text-[13px] tracking-tight">Notifikasi Sistem</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllAsRead} className="text-[10px] text-[#8c827a] hover:text-primary font-bold uppercase tracking-widest transition-colors">
                                                Tandai Dibaca
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto bg-white" style={{ scrollbarWidth: 'thin' }}>
                                        {!Array.isArray(notifications) || notifications.length === 0 ? (
                                            <div className="p-8 text-center text-[#8c827a] text-sm font-medium">
                                                Tidak ada notifikasi baru.
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => !notif.is_read && markAsRead(notif.id)} 
                                                    className={`p-4 border-b border-accent/5 hover:bg-[#fafaf9] transition-colors ${!notif.is_read ? 'bg-[#ede5ce]/30 cursor-pointer' : 'opacity-70'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1 gap-2">
                                                        <p className="text-[12px] font-extrabold text-primary leading-tight">{notif.title}</p>
                                                        {!notif.is_read && <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1"></span>}
                                                    </div>
                                                    <p className="text-[11px] text-[#6b6b6b] line-clamp-2 leading-relaxed mt-1">{notif.message}</p>
                                                    <p className="text-[9px] text-[#b8a28f] mt-2 font-bold tracking-widest uppercase">
                                                        {new Date(notif.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-accent/10 bg-surface/50 text-center">
                                        <Link to="/settings?tab=notifications" onClick={() => setShowNotifications(false)} className="text-[10px] uppercase tracking-widest font-bold text-[#8c827a] hover:text-primary">Atur Preferensi</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    
                        <div className="flex items-center gap-3 text-right">
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold text-primary">{user?.name || 'User'}</p>
                                <p className="text-[10px] text-accent uppercase tracking-wider">{user?.role || 'Guest'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary flex items-center justify-center text-white font-bold shadow-sm">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Canvas */}
                {children}

                {/* Mobile Bottom Nav */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-accent/20 h-16 flex items-center justify-around px-4 z-50 pb-safe">
                    <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-bold">Utama</span>
                    </NavLink>
                    <NavLink to="/trend" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                        <TrendingUp size={20} />
                        <span className="text-[10px] font-bold">Tren</span>
                    </NavLink>
                    <div className="relative -top-6">
                        <NavLink to="/products" className="bg-primary text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                            <Package size={24} />
                        </NavLink>
                    </div>
                    <NavLink to="/reports" className={({isActive}) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                        <FileText size={20} />
                        <span className="text-[10px] font-bold">Laporan</span>
                    </NavLink>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 text-on-surface ml-2">
                        <Menu size={20} className="text-secondary" />
                        <span className="text-[10px] font-bold">Menu</span>
                    </button>
                </nav>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden flex justify-end" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="w-72 bg-surface h-full flex flex-col p-6 shadow-xl transition-transform transform translate-x-0" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-8">
                                <span className="font-sans font-extrabold text-[#708F7F] text-[28px] tracking-tighter lowercase drop-shadow-sm">tataruma</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-accent hover:text-primary"><X size={24}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                                <NavItem to="/stock-requests" icon={ClipboardList} label="Permintaan Stok" />
                                <NavItem to="/transactions" icon={CreditCard} label="Transaksi" />
                                {user?.role === 'admin' && (
                                    <>
                                        <NavItem to="/users" icon={Users} label="Manajemen Pengguna" />
                                        <NavItem to="/data" icon={Database} label="Manajemen Data" />
                                    </>
                                )}
                                <NavDropdown user={user} />
                            </div>
                            <div className="mt-auto pt-4 border-t border-accent/20">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full bg-white text-on-surface border border-accent/20 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-surface active:scale-95 transition-all"
                                >
                                    <LogOut size={16} className="text-secondary" />
                                    <span className="text-sm">Keluar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
