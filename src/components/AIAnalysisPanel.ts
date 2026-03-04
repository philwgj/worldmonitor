import { Panel } from './Panel';
import { t } from '@/services/i18n';

interface AnalysisResult {
  summary?: string;
  opportunities?: Array<{ symbol: string; reason: string; confidence: number }>;
  risks?: Array<{ symbol: string; reason: string; severity: number }>;
}

export class AIAnalysisPanel extends Panel {
  private refreshInterval: number | null = null;

  constructor() {
    super({ id: 'ai-analysis', title: t('panels.aiAnalysis') || 'AI Analysis' });
    this.loadAndSchedule();
  }

  private async loadAndRender() {
    try {
      const resp = await fetch('/api/ai/analyze_structured', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => resp.statusText);
        this.showError('AI fetch failed: ' + txt);
        return;
      }
      const json = await resp.json();
      const obj: AnalysisResult = json.parsed || {};
      let html = '<div class="small">Provider: ' + (json.provider || 'unknown') + '</div>';
      html += '<h4>Summary</h4>' + (obj.summary ? `<div>${obj.summary}</div>` : '<div>–</div>');
      html += '<h4>Opportunities</h4><ul>' + (obj.opportunities||[]).map(o=>`<li>${o.symbol}: ${o.reason} (conf ${o.confidence})</li>`).join('') + '</ul>';
      html += '<h4>Risks</h4><ul>' + (obj.risks||[]).map(r=>`<li>${r.symbol}: ${r.reason} (sev ${r.severity})</li>`).join('') + '</ul>';
      this.setContent(html);
    } catch (e) {
      this.showError(String(e));
    }
  }

  private loadAndSchedule() {
    void this.loadAndRender();
    this.refreshInterval = window.setInterval(() => {
      void this.loadAndRender();
    }, 60_000);
  }

  destroy(): void {
    if (this.refreshInterval) window.clearInterval(this.refreshInterval);
    super.destroy?.();
  }
}
