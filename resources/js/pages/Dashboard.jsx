import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));
    
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [result, compResult] = await Promise.all([
                    api.getDashboard(),
                    api.getPeriodComparison()
                ]);
                setData(result);
                setComparisonData(compResult);
            } catch (e) {
                console.error("Dashboard fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-surface border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return <div className="p-8 text-center text-on-surface">Gagal memuat data dashboard.</div>;

    const COLORS = ['#456254', '#708f7f', '#b8a28f', '#f4e8dc', '#e6dbc9', '#d6c4a8'];
    const isOwner = user.role === 'owner';

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Ringkasan Eksekutif</h2>
                    <p className="text-secondary font-medium mt-1">Performa penjualan bulanan dan deteksi produk {isOwner ? 'otomatis' : ''}</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white border border-accent/20 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 text-on-surface">
                        Bulan Ini
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-accent/10 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Total Pendapatan</p>
                    <h3 className="text-3xl font-black text-primary font-headline">
                        Rp {(Number(data.kpi.total_revenue_month) / 1000000).toFixed(1)}M
                    </h3>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                        <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${data.kpi.revenue_change_pct >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {data.kpi.revenue_change_pct >= 0 ? '▲' : '▼'} {Math.abs(data.kpi.revenue_change_pct)}%
                        </span>
                        <span className="text-on-surface/60">vs bln lalu</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-accent/10 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Total Transaksi</p>
                    <h3 className="text-3xl font-black text-primary font-headline">
                        {data.kpi.total_transactions}
                    </h3>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                        <span className="text-on-surface/60">{data.kpi.total_sales_month} unit terjual</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-accent/10 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Kesehatan Produk</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-primary font-headline">
                            {data.underperforming_summary.healthy}
                        </h3>
                        <span className="text-on-surface font-semibold">/ {data.underperforming_summary.total_products} Naik</span>
                    </div>
                    <div className="w-full bg-surface h-2 rounded-full mt-4 overflow-hidden">
                        <div 
                            className="bg-secondary h-full rounded-full" 
                            style={{width: `${(data.underperforming_summary.healthy / data.underperforming_summary.total_products) * 100}%`}}
                        ></div>
                    </div>
                </div>

                <div className={`p-6 rounded-xl shadow-sm border ${data.underperforming_summary.underperforming > 0 ? 'bg-[#fff5f5] border-red-100' : 'bg-white border-accent/10'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${data.underperforming_summary.underperforming > 0 ? 'text-red-700' : 'text-accent'}`}>Underperforming</p>
                    <h3 className={`text-3xl font-black font-headline ${data.underperforming_summary.underperforming > 0 ? 'text-red-700' : 'text-primary'}`}>
                        {data.underperforming_summary.underperforming} <span className="text-sm font-semibold opacity-70">Produk</span>
                    </h3>
                    {data.underperforming_summary.underperforming > 0 && (
                        <div className="mt-4 text-xs font-bold text-red-600 bg-red-100/50 px-2 py-1 rounded inline-block">
                            {data.underperforming_summary.critical} Kritis
                        </div>
                    )}
                </div>
            </div>

            {/* AI Summary Banner (Stitch Design Inspired) */}
            <div className="bg-gradient-to-br from-primary to-[#2a3c33] text-white rounded-2xl p-6 shadow-md relative overflow-hidden mt-2">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4 scale-150">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5 .5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
                </div>
                
                <div className="flex items-center gap-2 mb-4 relative z-10">
                    <svg className="w-6 h-6 text-cream" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5 .5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
                    <h3 className="font-bold text-lg">Ringkasan Analitik AI</h3>
                </div>
                
                <ul className="space-y-4 text-sm font-medium leading-relaxed text-cream/90 relative z-10 max-w-4xl">
                    <li className="flex gap-3">
                        <span className="text-white">•</span>
                        <p>Total pendapatan tumbuh <span className="font-bold text-white border-b border-white/30">{data.kpi.revenue_change_pct}%</span>, dengan kontribusi utama dari penjualan offline bulanan.</p>
                    </li>
                    {data.underperforming_summary.underperforming > 0 && (
                        <li className="flex gap-3">
                            <span className="text-white">•</span>
                            <p>Terdapat <span className="font-bold text-white bg-red-500/30 px-1 rounded">{data.underperforming_summary.underperforming} produk</span> yang menunjukkan rasio tren penurunan beruntun. <span className="text-cream font-bold">Tindakan pemasaran diperlukan secepatnya.</span></p>
                        </li>
                    )}
                </ul>
            </div>

            {/* Extra Details for Admin/Manager */}
            {!isOwner && data.daily_revenue && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
                    {/* Bar Chart Wilayah / Revenue */}
                    <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-6 shadow-sm border border-accent/10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-primary text-lg">Tren Penjualan Harian</h3>
                                <p className="text-xs text-on-surface/60">Pendapatan dalam Rupiah (Bulan Ini)</p>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.daily_revenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b8a28f" opacity={0.2} />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{fontSize: 10, fill: '#6d5b4b'}}
                                        tickFormatter={(val) => val.substring(8, 10)}
                                    />
                                    <YAxis 
                                        hide 
                                        domain={[0, 'dataMax']} 
                                    />
                                    <RechartsTooltip 
                                        cursor={{fill: '#fef2e5'}}
                                        contentStyle={{borderRadius: '8px', border: '1px solid rgba(184, 162, 143, 0.2)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                                        labelFormatter={(label) => `Tanggal: ${label}`}
                                    />
                                    <Bar 
                                        dataKey="revenue" 
                                        fill="#456254" 
                                        radius={[4, 4, 0, 0]}
                                        activeBar={{ fill: '#708f7f' }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Chart Kategori */}
                    <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6 shadow-sm border border-accent/10 flex flex-col">
                        <h3 className="font-bold text-primary mb-6">Distribusi Kategori Produk</h3>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.category_revenue}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="revenue"
                                            nameKey="category"
                                        >
                                            {data.category_revenue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            formatter={(value) => [`Rp ${(Number(value)/1000000).toFixed(1)}M`, 'Revenue']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="w-full mt-4 space-y-2 max-h-32 overflow-y-auto">
                                {data.category_revenue.map((cat, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                            <span className="font-bold text-on-surface truncate max-w-[100px]">{cat.category}</span>
                                        </div>
                                        <span className="text-on-surface/80">Rp {(Number(cat.revenue)/1000000).toFixed(1)}M</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Underperforming Table Component - Only show if > 0 and user is not owner */}
            {!isOwner && data.underperforming && data.underperforming.length > 0 && (
                <div className="mt-4 bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
                    <div className="px-6 py-5 border-b border-accent/10 flex justify-between items-center bg-red-50/50">
                        <h3 className="font-bold text-red-800 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Kewaspadaan Produk (Underperforming)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">Produk / SKU</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Rasio Tren</th>
                                    <th className="px-6 py-4">Penurunan Berturut</th>
                                    <th className="px-6 py-4">Saran Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-accent/10 text-sm font-medium text-on-surface">
                                {data.underperforming.map((prod, i) => (
                                    <tr key={i} className="hover:bg-brand-bg transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-primary">{prod.product_name}</p>
                                            <p className="text-xs text-accent mt-0.5">{prod.product_sku}</p>
                                        </td>
                                        <td className="px-6 py-4">{prod.category}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${
                                                Number(prod.trend_ratio) < 50 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {prod.trend_ratio}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{prod.consecutive_decline} Periode</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-on-surface/80 leading-relaxed max-w-sm">{prod.recommendation}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Period Comparison UI */}
            {comparisonData && comparisonData.products && (
                <div className="mt-4 bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden p-6">
                    <div className="mb-6 border-b border-accent/10 pb-4 flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-primary text-xl flex items-center gap-2">
                                <TrendingUp size={20} className="text-[#456254]"/>
                                Perbandingan Pertumbuhan Produk
                            </h3>
                            <p className="text-sm text-accent mt-1">
                                Perbandingan {comparisonData.current_period} dengan {comparisonData.base_period}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Top Performers */}
                        <div>
                            <h4 className="font-bold text-green-700 text-sm mb-4 border-l-4 border-green-500 pl-2">Pertumbuhan Tertinggi</h4>
                            <div className="space-y-3">
                                {[...comparisonData.products].sort((a,b) => b.trend_ratio - a.trend_ratio).slice(0, 5).map(prod => (
                                    <div key={prod.product_id} className="flex justify-between items-center p-3 bg-green-50/30 rounded-lg border border-green-100">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-primary">{prod.product_name}</span>
                                            <span className="text-xs text-accent">{prod.category}</span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-green-700 font-black">+{prod.trend_ratio}%</span>
                                            <span className="text-[10px] text-accent">Rp {Number(prod.current_revenue).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Performers */}
                        <div>
                            <h4 className="font-bold text-red-700 text-sm mb-4 border-l-4 border-red-500 pl-2">Penurunan Terbesar</h4>
                            <div className="space-y-3">
                                {[...comparisonData.products]
                                    .filter(p => p.trend_ratio > 0 && p.trend_ratio < 100)
                                    .sort((a,b) => a.trend_ratio - b.trend_ratio).slice(0, 5)
                                    .map(prod => (
                                    <div key={prod.product_id} className="flex justify-between items-center p-3 bg-red-50/30 rounded-lg border border-red-100">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-primary">{prod.product_name}</span>
                                            <span className="text-xs text-accent">{prod.category}</span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-red-700 font-black">-{100 - Number(prod.trend_ratio)}%</span>
                                            <span className="text-[10px] text-accent">Rp {Number(prod.current_revenue).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
