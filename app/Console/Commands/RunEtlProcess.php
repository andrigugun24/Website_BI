<?php

namespace App\Console\Commands;

use App\Services\EtlService;
use Illuminate\Console\Command;

class RunEtlProcess extends Command
{
    protected $signature = 'etl:run {source=manual : Sumber data (manual|shopee|import)}';

    protected $description = 'Jalankan proses ETL untuk menarik, transformasi, dan memuat data penjualan.';

    public function handle(EtlService $etlService): int
    {
        $source = $this->argument('source');

        $this->info("Memulai proses ETL dari sumber: {$source}");
        $this->newLine();

        try {
            $log = $etlService->run($source);

            $this->info("✅ ETL selesai.");
            $this->table(
                ['Field', 'Value'],
                [
                    ['Source', $log->source],
                    ['Status', $log->status],
                    ['Records Processed', $log->records_processed],
                    ['Started At', $log->started_at],
                    ['Completed At', $log->completed_at],
                ]
            );

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ ETL gagal: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
