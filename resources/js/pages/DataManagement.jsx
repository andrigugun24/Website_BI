import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, Play, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, UploadCloud, X } from 'lucide-react';

export default function DataManagement() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await api.getEtlLogs();
            setLogs(data.data || []);
        } catch (e) {
            console.error("ETL logs error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const handleRunEtl = async () => {
        setRunning(true);
        setResult(null);
        try {
            const data = await api.runEtl();
            setResult({ success: true, message: data.message, log: data.log });
            fetchLogs();
        } catch (e) {
            setResult({ success: false, message: e.response?.data?.message || 'ETL gagal dijalankan.' });
        } finally {
            setRunning(false);
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'success': return <CheckCircle size={16} className="text-green-600" />;
            case 'failed': return <XCircle size={16} className="text-red-600" />;
            case 'running': return <RefreshCw size={16} className="text-blue-600 animate-spin" />;
            default: return <Clock size={16} className="text-accent" />;
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error('File CSV kosong atau tidak valid.');
                
                const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
                const data = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values.length !== headers.length) continue;
                    
                    const row = {};
                    headers.forEach((h, idx) => { row[h] = values[idx]; });
                    
                    // Validasi minimal field
                    if (row.sku && row.transaction_date && row.quantity_sold && row.unit_price) {
                        data.push({
                            sku: row.sku,
                            transaction_date: row.transaction_date,
                            quantity_sold: parseInt(row.quantity_sold),
                            unit_price: parseFloat(row.unit_price),
                            source: row.source || 'csv_import',
                            order_ref: row.order_ref || ''
                        });
                    }
                }
                
                if (data.length === 0) throw new Error('Tidak ada data valid ditemukan. Pastikan format header sesuai (sku, transaction_date, quantity_sold, unit_price, source, order_ref).');
                
                const res = await api.importData(data);
                setIsUploadModalOpen(false);
                setResult({ success: true, message: res.message, log: { records_processed: res.records_processed, status: 'SUCCESS' } });
            } catch (err) {
                alert(err.message || 'Gagal memproses file CSV');
            } finally {
                setUploading(false);
                e.target.value = ''; // Reset file input
            }
        };
        reader.onerror = () => {
            alert('Gagal membaca file');
            setUploading(false);
        };
        reader.readAsText(file);
    };

    const getStatusBadge = (status) => {
        const styles = {
            success: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
            running: 'bg-blue-100 text-blue-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Manajemen Data</h2>
                    <p className="text-accent font-medium mt-1">ETL Pipeline & Sinkronisasi Data</p>
                </div>
                <div className="flex gap-2 self-start">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-white text-on-surface border border-accent/20 px-4 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-surface transition-colors"
                    >
                        <UploadCloud size={16} /> Import Data CSV
                    </button>
                    <button
                        onClick={handleRunEtl}
                        disabled={running}
                        className="bg-[#456254] text-white px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#384f44] transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {running ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                        {running ? 'Menjalankan ETL...' : 'Jalankan ETL Manual'}
                    </button>
                </div>
            </div>

            {/* ETL Result Banner */}
            {result && (
                <div className={`rounded-xl p-5 border flex items-start gap-3 ${
                    result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                }`}>
                    {result.success ? <CheckCircle size={20} className="text-green-600 mt-0.5" /> : <AlertTriangle size={20} className="text-red-600 mt-0.5" />}
                    <div>
                        <p className={`font-semibold text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                            {result.message}
                        </p>
                        {result.log && (
                            <p className="text-xs mt-1 text-green-600">
                                Records diproses: {result.log.records_processed} | Status: {result.log.status}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-accent/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                            <Database size={20} className="text-primary" />
                        </div>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Sumber Data</p>
                    </div>
                    <h3 className="text-xl font-black text-primary">Manual</h3>
                    <p className="text-xs text-accent mt-1">Import & entry manual</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-accent/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                            <Clock size={20} className="text-secondary" />
                        </div>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Jadwal ETL</p>
                    </div>
                    <h3 className="text-xl font-black text-primary">02:00 WIB</h3>
                    <p className="text-xs text-accent mt-1">Setiap hari otomatis</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-accent/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                            <AlertTriangle size={20} className="text-orange-500" />
                        </div>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Shopee API</p>
                    </div>
                    <h3 className="text-xl font-black text-accent">Belum Aktif</h3>
                    <p className="text-xs text-accent mt-1">Menunggu konfigurasi</p>
                </div>
            </div>

            {/* ETL Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-accent/10 overflow-hidden">
                <div className="px-6 py-5 border-b border-accent/10 flex justify-between items-center bg-surface/30">
                    <h3 className="font-bold text-primary text-sm">Riwayat Proses ETL</h3>
                    <button onClick={fetchLogs} className="text-xs text-secondary font-semibold flex items-center gap-1 hover:text-primary transition-colors">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-4 border-surface border-t-primary rounded-full animate-spin mx-auto"></div>
                        <p className="text-accent text-sm mt-3">Memuat log ETL...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Database size={40} className="mx-auto text-accent/40 mb-4" />
                        <p className="text-on-surface font-semibold">Belum ada riwayat ETL</p>
                        <p className="text-accent text-sm mt-1">Klik "Jalankan ETL Manual" untuk memulai proses pertama.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface/50 text-accent text-[10px] uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Sumber</th>
                                    <th className="px-6 py-4 text-right">Records</th>
                                    <th className="px-6 py-4">Mulai</th>
                                    <th className="px-6 py-4">Selesai</th>
                                    <th className="px-6 py-4">Error</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-accent/5 text-sm font-medium text-on-surface">
                                {logs.map((log, i) => (
                                    <tr key={i} className="hover:bg-brand-bg transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(log.status)}
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(log.status)}`}>
                                                    {log.status?.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 capitalize">{log.source}</td>
                                        <td className="px-6 py-3 text-right font-bold text-primary">{log.records_processed || 0}</td>
                                        <td className="px-6 py-3 text-xs text-accent">{log.started_at?.substring(0, 19).replace('T', ' ')}</td>
                                        <td className="px-6 py-3 text-xs text-accent">{log.completed_at?.substring(0, 19).replace('T', ' ') || '-'}</td>
                                        <td className="px-6 py-3 text-xs text-red-500 max-w-[200px] truncate">{log.error_message || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-accent/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-accent/10 flex justify-between items-center bg-surface/50">
                            <h3 className="font-bold text-primary text-lg">Import Data Transaksi</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-accent hover:text-primary"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-accent mb-4">
                                Unggah file CSV dengan header wajib berikut (huruf kecil):<br/>
                                <code className="bg-surface px-1 py-0.5 rounded text-secondary font-mono text-xs shadow-sm block mt-2 whitespace-normal break-words">
                                    sku, transaction_date, quantity_sold, unit_price
                                </code>
                            </p>
                            <div className="border-2 border-dashed border-accent/20 rounded-lg p-6 text-center hover:bg-surface/50 transition-colors">
                                <input 
                                    type="file" 
                                    accept=".csv" 
                                    id="csvFile" 
                                    className="hidden" 
                                    onChange={handleFileUpload} 
                                    disabled={uploading}
                                />
                                <label htmlFor="csvFile" className={`cursor-pointer flex flex-col items-center gap-2 ${uploading ? 'opacity-50' : ''}`}>
                                    <UploadCloud size={32} className="text-primary" />
                                    <span className="font-semibold text-primary">{uploading ? 'Memproses File...' : 'Pilih File CSV'}</span>
                                    <span className="text-xs text-accent">Maks 2MB</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
