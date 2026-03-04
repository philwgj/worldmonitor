import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { fetchQuotes } from '@/services/dolphindb';

export class MarketLitePanel extends Panel {
  private refreshInterval: number | null = null;

  constructor() {
    super({ id: 'market-lite', title: t('panels.markets') + ' (Lite)' });
    this.loadAndSchedule();
  }

  private async loadAndRender() {
    try {
      const quotes = await fetchQuotes();
      if (!Array.isArray(quotes)) {
        this.showError('Failed to load quotes');
        return;
      }

      const valid = quotes.filter(q => typeof q.price === 'number');
      const totalVolume = valid.reduce((s, q) => s + (q.volume || 0), 0);
      const ranked = [...valid].sort((a, b) => (b.change || 0) - (a.change || 0));

      const html = `
        <div class="small">Instruments: ${quotes.length} • Volume: ${totalVolume}</div>
        <h4>Top movers</h4>
        <ul>${ranked.slice(0,8).map(r=>`<li>${r.symbol}: ${(r.change||0).toFixed(2)}% @ ${r.price==null?'-':r.price}</li>`).join('')}</ul>
      `;

      this.setContent(html);
    } catch (e) {
      this.showError(String(e));
    }
  }

  private loadAndSchedule() {
    void this.loadAndRender();
    this.refreshInterval = window.setInterval(() => {
      void this.loadAndRender();
    }, 30_000);
  }

  destroy(): void {
    if (this.refreshInterval) window.clearInterval(this.refreshInterval);
    super.destroy?.();
  }
}
