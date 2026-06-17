import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Clock, TrendingUp, BarChart3, Calendar } from 'lucide-react';

/* ───── Skeleton Components ───── */
const SkeletonPulse = ({ className = '' }) => (
    <div className={`animate-pulse bg-gradient-to-r from-accent/10 via-accent/20 to-accent/10 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded ${className}`} />
);

const SkeletonChart = () => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
        <SkeletonPulse className="h-5 w-56 mb-2" />
        <SkeletonPulse className="h-3 w-40 mb-8" />
        <div className="flex items-end gap-2 h-64">
            {[60,80,45,90,70,55,85,65,75,50].map((h,i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                    <SkeletonPulse className="rounded-t" style={{height: `${h}%`}} />
                </div>
            ))}
        </div>
    </div>
);

const SkeletonTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-accent/10 bg-surface/30">
            <SkeletonPulse className="h-4 w-48" />
        </div>
        <div className="p-0">
            <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-surface/50">
                {[...Array(5)].map((_,i) => <SkeletonPulse key={i} className="h-3 w-full" />)}
            </div>
            {[...Array(6)].map((_,i) => (
                <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-accent/5">
                    <SkeletonPulse className="h-4 w-full" />
                    <SkeletonPulse className="h-3 w-3/4" />
                    <SkeletonPulse className="h-3 w-2/3" />
                    <SkeletonPulse className="h-3 w-1/2" />
                    <SkeletonPulse className="h-5 w-16 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

export default function TrendAnalysis() {
    const [activeTab, setActiveTab] = useState('trend');
    const [items, setItems] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Period Comparison state
    const [comparisonData, setComparisonData] = useState(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const today = new Date();
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

    const [periodA, setPeriodA] = useState({ start: firstDayThisMonth, end: todayStr });
    const [periodB, setPeriodB] = useState({ start: firstDayLastMonth, end: lastDayLastMonth });

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [trendRes, heatRes] = await Promise.all([
                    api.getAnalyticsTrend(),
                    api.getHeatmap()
                ]);

                const records = trendRes.data || trendRes;
                const mapped = (Array.isArray(records) ? records : []).map(item => ({
                    product_name: item.product?.name || 'N/A',
                    product_sku: item.product?.sku || '-',
                    category: item.product?.category || '-',
                    current_value: Number(item.current_value) || 0,
                    base_value: Number(item.base_value) || 0,
                    trend_ratio: Number(item.trend_ratio) || 0,
                    is_underperforming: item.is_underperforming,
                    consecutive_decline: item.consecutive_decline || 0,
                }));
                setItems(mapped);
                setHeatmapData(heatRes || []);
            } catch (e) {
                console.error("Analytic fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const fetchComparison = async () => {
        setComparisonLoading(true);
        try {
            const qs = new URLSearchParams({
                current_start: periodA.start,
                current_end: periodA.end,
                base_start: periodB.start,
                base_end: periodB.end,
            }).toString();
            const res = await api.getPeriodComparison(qs);
            setComparisonData(res);
        } catch (e) {
            console.error("Comparison fetch error", e);
        } finally {
            setComparisonLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'comparison') {
            fetchComparison();
        }
    }, [activeTab]);

    if (loading) return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <SkeletonPulse className="h-8 w-64 mb-2" />
                    <SkeletonPulse className="h-4 w-80" />
                </div>
                <div className="flex gap-2">
                    <SkeletonPulse className="h-10 w-32 rounded-lg" />
                    <SkeletonPulse className="h-10 w-36 rounded-lg" />
                    <SkeletonPulse className="h-10 w-44 rounded-lg" />
                </div>
            </div>
            <SkeletonChart />
            <SkeletonTable />
        </div>
    );

    if (!items.length) return <div className="p-8 text-center text-on-surface">Data tren tidak tersedia. Silakan jalankan ETL terlebih dahulu.</div>;

    const chartData = [...items]
        .sort((a, b) => b.current_value - a.current_value)
        .slice(0, 10)
        .map(item => ({
            name: item.product_name,
            current: item.current_value,
            base: item.base_value,
            ratio: item.trend_ratio
        }));

    // Prepare comparison chart data
    const comparisonChartData = comparisonData?.products
        ? [...comparisonData.products]
            .filter(p => p.current_revenue > 0 || p.base_revenue > 0)
            .sort((a, b) => b.current_revenue - a.current_revenue)
            .slice(0, 15)
            .map(p => ({
                name: p.product_name.length > 14 ? p.product_name.substring(0, 14) + '…' : p.product_name,
                'Periode A': Number(p.current_revenue),
                'Periode B': Number(p.base_revenue),
                ratio: p.trend_ratio,
            }))
        : [];

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Eksplorasi Analitik</h2>
                    <p className="text-accent font-medium mt-1 italic">Analisis waktu, tren, dan histori transaksi</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setActiveTab('trend')} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'trend' ? 'bg-[#456254] text-white' : 'bg-white text-on-surface border border-accent/20 hover:bg-surface'}`}>
                        <TrendingUp size={16}/> Tren Produk
                    </button>
                    <button onClick={() => setActiveTab('heatmap')} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'heatmap' ? 'bg-[#456254] text-white' : 'bg-white text-on-surface border border-accent/20 hover:bg-surface'}`}>
                        <Clock size={16}/> Heatmap Waktu
                    </button>
                    <button onClick={() => setActiveTab('comparison')} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'comparison' ? 'bg-[#456254] text-white' : 'bg-white text-on-surface border border-accent/20 hover:bg-surface'}`}>
                        <BarChart3 size={16}/> Perbandingan Periode
                    </button>
                </div>
            </div>

            {activeTab === 'trend' && (
                <>
            {/* Area Chart Komparatif */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="font-bold text-primary text-lg">Perbandingan Tren (Top 10 Produk)</h3>
                        <p className="text-xs text-accent">Berdasarkan Total Pendapatan Produk</p>
                    </div>
                    <div className="flex gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary opacity-80"></span> Saat Ini</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-secondary opacity-30"></span> Dasar</div>
                    </div>
                </div>
                
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#456254" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#456254" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#708f7f" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#708f7f" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: '#b8a28f'}}
                                tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '…' : val}
                            />
                            <YAxis hide />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b8a28f" opacity={0.1} />
                            <RechartsTooltip 
                                formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                                contentStyle={{borderRadius: '8px', border: '1px solid rgba(184, 162, 143, 0.2)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Area type="monotone" dataKey="base" stroke="#708f7f" strokeWidth={2} fillOpacity={1} fill="url(#colorBase)" name="Periode Dasar" />
                            <Area type="monotone" dataKey="current" stroke="#456254" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" name="Periode Saat Ini" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detail Table */}
            <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
                <div className="px-6 py-5 border-b border-accent/10 flex justify-between items-center bg-surface/30">
                    <h3 className="font-bold text-primary">Rincian Performa Seluruh Produk</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Produk / SKU</th>
                                <th className="px-6 py-4 text-right">Penjualan Dasar</th>
                                <th className="px-6 py-4 text-right">Penjualan Kini</th>
                                <th className="px-6 py-4">Rasio (%)</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                            {items.map((item, i) => {
                                const ratio = item.trend_ratio;
                                let statusCls = "bg-green-100 text-green-700";
                                let statusTxt = "STABIL / NAIK";
                                
                                if (ratio < 80) {
                                    statusCls = "bg-red-100 text-red-700";
                                    statusTxt = "KRITIS";
                                } else if (ratio < 100) {
                                    statusCls = "bg-orange-100 text-orange-700";
                                    statusTxt = "TURUN";
                                }

                                return (
                                    <tr key={i} className="hover:bg-brand-bg transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-primary">{item.product_name}</p>
                                            <p className="text-xs text-accent mt-0.5">{item.product_sku} • {item.category}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right text-accent">
                                            Rp {item.base_value.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-primary">
                                            Rp {item.current_value.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${ratio >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {ratio}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${statusCls}`}>
                                                {statusTxt}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            )}

            {activeTab === 'heatmap' && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                    <h3 className="font-bold text-primary text-lg mb-1 flex items-center gap-2">
                        <Activity size={20} /> Intensitas Transaksi (Heatmap)
                    </h3>
                    <p className="text-xs text-accent mb-8">Sebaran jam sibuk aktivitas transaksi setiap hari.</p>
                    
                    <div className="overflow-x-auto">
                        <div className="min-w-[700px]">
                            <div className="grid grid-cols-25 gap-1 mb-2">
                                <div className="col-span-1"></div>
                                {[...Array(24)].map((_, h) => (
                                    <div key={h} className="col-span-1 text-center text-[10px] font-bold text-accent">
                                        {h.toString().padStart(2, '0')}
                                    </div>
                                ))}
                            </div>
                            
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                const dayData = heatmapData.filter(d => d.day_name === day);
                                const maxSales = Math.max(...heatmapData.map(d => d.transaction_count || 0), 1);
                                
                                const dayNamesID = {
                                    'Monday': 'Senin', 'Tuesday': 'Selasa', 'Wednesday': 'Rabu', 
                                    'Thursday': 'Kamis', 'Friday': 'Jumat', 'Saturday': 'Sabtu', 'Sunday': 'Minggu'
                                };

                                return (
                                    <div key={day} className="grid grid-cols-[80px_repeat(24,_1fr)] gap-1 mb-1 items-center">
                                        <div className="text-xs font-semibold text-primary">{dayNamesID[day]}</div>
                                        {[...Array(24)].map((_, hour) => {
                                            const cellData = dayData.find(d => d.hour === hour);
                                            const count = cellData ? cellData.transaction_count : 0;
                                            const revenue = cellData ? cellData.total_revenue : 0;
                                            const intensity = count > 0 ? Math.max(0.1, count / maxSales) : 0;
                                            
                                            return (
                                                <div 
                                                    key={hour} 
                                                    className="w-full pb-[100%] relative rounded-sm group"
                                                    style={{ backgroundColor: count > 0 ? `rgba(69, 98, 84, ${intensity})` : '#f8f9fa' }}
                                                >
                                                    {count > 0 && (
                                                        <div className="absolute inset-x-0 bottom-full mb-1 hidden group-hover:block z-10 w-32 bg-[#456254] text-white text-[10px] p-2 rounded shadow-lg text-center left-1/2 -translate-x-1/2">
                                                            <p className="font-bold">{count} Transaksi</p>
                                                            <p className="opacity-80">Rp {Number(revenue).toLocaleString('id-ID')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ NEW: Period Comparison Tab ═══════ */}
            {activeTab === 'comparison' && (
                <div className="flex flex-col gap-6">
                    {/* Date Pickers */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                        <h3 className="font-bold text-primary text-lg mb-4 flex items-center gap-2">
                            <Calendar size={20} /> Pilih Periode Perbandingan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-[#456254]/5 rounded-xl border border-[#456254]/10">
                                <p className="text-xs font-bold text-[#456254] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#456254]"></span> Periode A (Saat Ini)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1">Mulai</label>
                                        <input type="date" value={periodA.start} onChange={e => setPeriodA({...periodA, start: e.target.value})}
                                            className="w-full px-3 py-2 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1">Selesai</label>
                                        <input type="date" value={periodA.end} onChange={e => setPeriodA({...periodA, end: e.target.value})}
                                            className="w-full px-3 py-2 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-orange-400"></span> Periode B (Pembanding)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1">Mulai</label>
                                        <input type="date" value={periodB.start} onChange={e => setPeriodB({...periodB, start: e.target.value})}
                                            className="w-full px-3 py-2 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-accent uppercase block mb-1">Selesai</label>
                                        <input type="date" value={periodB.end} onChange={e => setPeriodB({...periodB, end: e.target.value})}
                                            className="w-full px-3 py-2 rounded-lg border border-accent/20 focus:border-primary outline-none text-sm bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={fetchComparison} disabled={comparisonLoading}
                            className="mt-4 bg-[#456254] text-white px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#384f44] transition-colors disabled:opacity-50">
                            <BarChart3 size={16} />
                            {comparisonLoading ? 'Memproses...' : 'Bandingkan Periode'}
                        </button>
                    </div>

                    {/* Comparison Chart */}
                    {comparisonLoading ? (
                        <SkeletonChart />
                    ) : comparisonData && comparisonChartData.length > 0 ? (
                        <>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-primary text-lg">Perbandingan Revenue per Produk</h3>
                                    <p className="text-xs text-accent mt-1">
                                        <span className="font-semibold text-[#456254]">■</span> {comparisonData.current_period} vs{' '}
                                        <span className="font-semibold text-orange-400">■</span> {comparisonData.base_period}
                                    </p>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b8a28f" opacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#b8a28f'}} />
                                        <YAxis hide />
                                        <RechartsTooltip
                                            formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                                            contentStyle={{borderRadius: '8px', border: '1px solid rgba(184, 162, 143, 0.2)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        />
                                        <Bar dataKey="Periode A" fill="#456254" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Periode B" fill="#e8a87c" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Comparison Detail Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
                            <div className="px-6 py-5 border-b border-accent/10 bg-surface/30">
                                <h3 className="font-bold text-primary text-sm">Detail Perbandingan Seluruh Produk</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                                        <tr>
                                            <th className="px-6 py-4">Produk</th>
                                            <th className="px-6 py-4">Kategori</th>
                                            <th className="px-6 py-4 text-right">Revenue Periode A</th>
                                            <th className="px-6 py-4 text-right">Revenue Periode B</th>
                                            <th className="px-6 py-4 text-center">Rasio</th>
                                            <th className="px-6 py-4 text-center">Perubahan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                                        {comparisonData.products.map((prod, i) => {
                                            const change = Number(prod.current_revenue) - Number(prod.base_revenue);
                                            const isGrowing = Number(prod.trend_ratio) >= 100;
                                            return (
                                                <tr key={i} className="hover:bg-brand-bg transition-colors">
                                                    <td className="px-6 py-3 font-bold text-primary">{prod.product_name}</td>
                                                    <td className="px-6 py-3 text-accent">{prod.category}</td>
                                                    <td className="px-6 py-3 text-right font-semibold">Rp {Number(prod.current_revenue).toLocaleString('id-ID')}</td>
                                                    <td className="px-6 py-3 text-right text-accent">Rp {Number(prod.base_revenue).toLocaleString('id-ID')}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className={`font-bold ${isGrowing ? 'text-green-600' : 'text-red-600'}`}>
                                                            {prod.trend_ratio}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${isGrowing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {isGrowing ? '▲' : '▼'} Rp {Math.abs(change).toLocaleString('id-ID')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </>
                    ) : comparisonData ? (
                        <div className="bg-white rounded-xl p-12 shadow-sm border border-accent/10 text-center">
                            <BarChart3 size={40} className="mx-auto text-accent/40 mb-4" />
                            <p className="text-on-surface font-semibold">Data tidak tersedia untuk periode yang dipilih</p>
                            <p className="text-accent text-sm mt-1">Coba pilih periode lain yang memiliki data transaksi.</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
