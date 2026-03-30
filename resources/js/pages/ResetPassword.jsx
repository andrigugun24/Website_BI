import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const queryParams = new URLSearchParams(location.search);
    const tokenParams = queryParams.get('token');
    const emailParams = queryParams.get('email');

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!tokenParams || !emailParams) {
            Swal.fire({
                icon: 'error',
                title: 'Link Tidak Valid',
                text: 'Tautan pemulihan kata sandi tidak lengkap atau salah.',
                confirmButtonColor: '#456254',
            }).then(() => {
                navigate('/login');
            });
        } else {
            setToken(tokenParams);
            setEmail(emailParams);
        }
    }, [tokenParams, emailParams, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (password !== passwordConfirmation) {
            setError('Konfirmasi kata sandi tidak cocok.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.resetPassword({
                email,
                token,
                password,
                password_confirmation: passwordConfirmation
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: res.message || 'Kata sandi berhasil diubah. Silakan masuk menggunakan kata sandi baru Anda.',
                confirmButtonColor: '#456254',
            }).then(() => {
                navigate('/login');
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengubah kata sandi. Link mungkin kadaluarsa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans" style={{ background: 'linear-gradient(135deg, #c4bfaa 0%, #e6e2d8 50%, #d8d3c8 100%)' }}>
            <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[120%] bg-white opacity-40 blur-[100px] transform rotate-12 pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[80%] bg-[#f4e8dc] opacity-30 blur-[120px] pointer-events-none"></div>

            <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
                <div className="w-10 h-10 bg-[#456254] text-white flex items-center justify-center font-bold text-lg rounded shadow-sm">TT</div>
                <h1 className="text-xl font-bold text-[#456254] tracking-tight">Tataruma BI</h1>
            </div>

            <div className="bg-[#fcfcfb] w-full max-w-md p-10 md:p-12 rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.08)] relative z-10">
                <h2 className="text-[24px] font-extrabold text-[#2a2a2a] leading-tight mb-2 tracking-tight">Atur Kata Sandi Baru</h2>
                <p className="text-[13px] text-[#6b6b6b] leading-relaxed mb-8">
                    Silakan masukkan kata sandi baru untuk akun <strong className="text-[#456254]">{email}</strong>.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#8c827a] uppercase tracking-widest block">
                            Kata Sandi Baru
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pb-2 pr-10 bg-transparent border-0 border-b border-[#e0aba6]/30 focus:border-[#456254] text-[#2a2a2a] focus:ring-0 transition-colors placeholder:text-[#b8a28f]/60 outline-none text-[15px] tracking-widest"
                                placeholder={showPassword ? "masukkan kata sandi" : "Minimal 8 karakter"}
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

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#8c827a] uppercase tracking-widest block">
                            Konfirmasi Kata Sandi Baru
                        </label>
                        <input
                            type="password"
                            required
                            value={passwordConfirmation}
                            onChange={e => setPasswordConfirmation(e.target.value)}
                            className="w-full pb-2 bg-transparent border-0 border-b border-[#e0aba6]/30 focus:border-[#456254] text-[#2a2a2a] focus:ring-0 transition-colors placeholder:text-[#b8a28f]/60 outline-none text-[15px] tracking-widest"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className={`w-full py-4 rounded font-bold text-white transition-all ${
                                loading || !password
                                ? 'bg-[#708f7f] cursor-wait' 
                                : 'bg-[#456254] hover:bg-[#384f44] active:scale-[0.98]'
                            }`}
                        >
                            {loading ? 'Memproses...' : 'Simpan Kata Sandi'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center border-t border-[#e0aba6]/20 pt-6">
                    <Link to="/login" className="text-[13px] font-bold text-[#456254] hover:text-[#2a3c33] transition-colors">
                        Kembali ke Halaman Login
                    </Link>
                </div>
            </div>
            
            <div className="absolute bottom-6 left-8 right-8 flex flex-col md:flex-row justify-between items-center text-[12px] font-medium text-[#8c827a] z-10 gap-4">
                <div>
                    <span className="font-bold text-[#456254]">Tataruma BI</span> <span className="opacity-80">© 2024 PT Tataruma. Semua Hak Dilindungi.</span>
                </div>
            </div>
        </div>
    );
}
