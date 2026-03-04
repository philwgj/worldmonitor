import { Panel } from './Panel';
import { t } from '@/services/i18n';
import { fetchIV } from '@/services/dolphindb';

export class IVLitePanel extends Panel {
  private refreshInterval: number | null = null;
  constructor() {
    super({ id: 'iv-lite', title: t('panels.iv') || 'IV (Lite)' });
    this.loadAndSchedule();
  }

  private async loadAndRender() {
    try {
      const ivs = await fetchIV();
      if (!Array.isArray(ivs)) {
        this.showError('Failed to load IV');
        return;
      }
      const html = `<table><thead><tr><th>Symbol</th><th>IV</th></tr></thead><tbody>${ivs.map(i=>`<tr><td>${i.symbol}</td><td>${i.iv==null?'-':(i.iv*100).toFixed(2)+'%'}</td></tr>`).join('')}</tbody></table>`;
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
