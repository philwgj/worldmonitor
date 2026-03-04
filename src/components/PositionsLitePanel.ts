import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { fetchPositions } from '@/services/dolphindb';

export class PositionsLitePanel extends Panel {
  private refreshInterval: number | null = null;
  constructor() {
    super({ id: 'positions-lite', title: t('panels.positions') || 'Positions (Lite)' });
    this.loadAndSchedule();
  }

  private async loadAndRender() {
    try {
      const pos = await fetchPositions();
      if (!Array.isArray(pos)) {
        this.showError('Failed to load positions');
        return;
      }
      const html = `<table><thead><tr><th>Acct</th><th>Symbol</th><th>Side</th><th>Qty</th></tr></thead><tbody>${pos.map(p=>`<tr><td>${p.account||'-'}</td><td>${p.symbol}</td><td>${p.side}</td><td>${p.quantity}</td></tr>`).join('')}</tbody></table>`;
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
