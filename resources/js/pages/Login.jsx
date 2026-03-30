import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Prevent going back to login if already logged in
    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const { value: emailInput } = await Swal.fire({
            title: 'Lupa Kata Sandi?',
            input: 'email',
            inputLabel: 'Masukkan alamat email yang terdaftar',
            inputPlaceholder: 'nama@perusahaan.com',
            showCancelButton: true,
            confirmButtonText: 'Kirim Link Reset',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#456254',
            cancelButtonColor: '#8c827a',
            inputValidator: (value) => {
                if (!value) {
                    return 'Anda harus memasukkan email!';
                }
            }
        });

        if (emailInput) {
            Swal.fire({
                title: 'Memproses...',
                text: 'Sedang menghubungi server...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            try {
                await api.forgotPassword({ email: emailInput });
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Tautan pemulihan kata sandi telah dikirim. (Catatan: Mode DEV mencetak link ke terminal/log).',
                    confirmButtonColor: '#456254',
                });
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: err.response?.data?.message || 'Terjadi kesalahan pada server.',
                    confirmButtonColor: '#456254',
                });
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans" style={{ background: 'linear-gradient(135deg, #c4bfaa 0%, #e6e2d8 50%, #d8d3c8 100%)' }}>
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[120%] bg-white opacity-40 blur-[100px] transform rotate-12 pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[80%] bg-[#f4e8dc] opacity-30 blur-[120px] pointer-events-none"></div>

            {/* Top Left Logo Area */}
            <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
                <div className="w-10 h-10 bg-[#456254] text-white flex items-center justify-center font-bold text-lg rounded shadow-sm">
                    TT
                </div>
                <h1 className="text-xl font-bold text-[#456254] tracking-tight">Tataruma BI</h1>
            </div>

            {/* Login Card */}
            <div className="bg-[#fcfcfb] w-full max-w-md p-10 md:p-12 rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.08)] relative z-10">
                <h2 className="text-[28px] font-extrabold text-[#2a2a2a] leading-tight mb-2 tracking-tight">Selamat Datang Kembali</h2>
                <p className="text-[14px] text-[#6b6b6b] leading-relaxed mb-10">
                    Silakan masuk ke panel intelijen bisnis Anda untuk memantau pertumbuhan hari ini.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#8c827a] uppercase tracking-widest block">
                            Email Perusahaan
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pb-2 bg-transparent border-0 border-b border-[#e0aba6]/30 focus:border-[#456254] text-[#2a2a2a] focus:ring-0 transition-colors placeholder:text-[#b8a28f]/60 outline-none text-[15px]"
                            placeholder="nama@perusahaan.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#8c827a] uppercase tracking-widest block">
                            Kata Sandi
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pb-2 pr-10 bg-transparent border-0 border-b border-[#e0aba6]/30 focus:border-[#456254] text-[#2a2a2a] focus:ring-0 transition-colors placeholder:text-[#b8a28f]/60 outline-none text-[15px] tracking-widest"
                                placeholder={showPassword ? "masukkan kata sandi" : "••••••••"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8c827a] hover:text-[#456254] transition-colors pb-2"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" className="peer w-4 h-4 border border-[#c4bbaa] rounded-sm appearance-none checked:bg-[#456254] checked:border-[#456254] transition-colors cursor-pointer" />
                                <svg className="absolute left-0.5 top-0.5 w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-[13px] font-medium text-[#6b6b6b] group-hover:text-[#456254] transition-colors">Ingat Saya</span>
                        </label>
                        <button type="button" onClick={handleForgotPassword} className="text-[13px] font-bold text-[#456254] hover:text-[#2a3c33] transition-colors">Lupa Kata Sandi?</button>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded font-bold text-white transition-all ${
                                loading 
                                ? 'bg-[#708f7f] cursor-wait' 
                                : 'bg-[#456254] hover:bg-[#384f44] active:scale-[0.98]'
                            }`}
                        >
                            {loading ? 'Memproses...' : 'Masuk Sekarang'}
                        </button>
                    </div>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[13px] italic text-[#8c827a]">
                        "Data adalah akar dari setiap keputusan yang bijak."
                    </p>
                </div>
                
                {/* Demo Logins Details */}
                <div className="mt-6 flex justify-center gap-4 text-[11px] text-[#b8a28f] font-medium opacity-60 hover:opacity-100 transition-opacity">
                    <button onClick={() => {setEmail('admin@tataruma.com'); setPassword('password123');}} className="hover:text-[#456254] transition-colors underline decoration-dotted">Admin</button>
                    <button onClick={() => {setEmail('manager@tataruma.com'); setPassword('password123');}} className="hover:text-[#456254] transition-colors underline decoration-dotted">Manager</button>
                    <button onClick={() => {setEmail('owner@tataruma.com'); setPassword('password123');}} className="hover:text-[#456254] transition-colors underline decoration-dotted">Owner</button>
                </div>
            </div>

            {/* Footer Area */}
            <div className="absolute bottom-6 left-8 right-8 flex flex-col md:flex-row justify-between items-center text-[12px] font-medium text-[#8c827a] z-10 gap-4">
                <div>
                    <span className="font-bold text-[#456254]">Tataruma BI</span> <span className="opacity-80">© 2024 PT Tataruma. Semua Hak Dilindungi.</span>
                </div>
                <div className="flex items-center gap-6 opacity-80">
                    <a href="#" className="hover:text-[#456254] transition-colors">Privasi</a>
                    <a href="#" className="hover:text-[#456254] transition-colors">Syarat & Ketentuan</a>
                    <a href="#" className="hover:text-[#456254] transition-colors">Bantuan</a>
                </div>
            </div>
        </div>
    );
}
