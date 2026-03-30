import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, TrendingUp } from 'lucide-react';

export default function TrendAnalysis() {
    const [activeTab, setActiveTab] = useState('trend');
    const [items, setItems] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [trendRes, heatRes] = await Promise.all([
                    api.getAnalyticsTrend(),
                    api.getHeatmap()
                ]);

                // Trend mapping
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

                // Heatmap mapping
                setHeatmapData(heatRes || []);

            } catch (e) {
                console.error("Analytic fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-surface border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    if (!items.length) return <div className="p-8 text-center text-on-surface">Data tren tidak tersedia. Silakan jalankan ETL terlebih dahulu.</div>;

    // Transform data for Area chart — Top 10 by current_value
    const chartData = [...items]
        .sort((a, b) => b.current_value - a.current_value)
        .slice(0, 10)
        .map(item => ({
            name: item.product_name,
            current: item.current_value,
            base: item.base_value,
            ratio: item.trend_ratio
        }));

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Eksplorasi Analitik</h2>
                    <p className="text-accent font-medium mt-1 italic">Analisis waktu, tren, dan histori transaksi</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('trend')} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'trend' ? 'bg-[#456254] text-white' : 'bg-white text-on-surface border border-accent/20 hover:bg-surface'}`}>
                        <TrendingUp size={16}/> Tren Produk
                    </button>
                    <button onClick={() => setActiveTab('heatmap')} className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'heatmap' ? 'bg-[#456254] text-white' : 'bg-white text-on-surface border border-accent/20 hover:bg-surface'}`}>
                        <Clock size={16}/> Heatmap Waktu
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
                                <div className="col-span-1"></div> {/* Empty corner */}
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
                                            
                                            // Calculate intensity opacity
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
        </div>
    );
}
