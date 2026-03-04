import { Panel } from './Panel';
import { t } from '@/services/i18n';

const FEEDS = [
  'https://feeds.reuters.com/Reuters/worldNews',
  'https://rss.cnn.com/rss/edition.rss',
];

function parseFeed(xmlText: string): Array<{ title: string; link: string }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const items = doc.querySelectorAll('item');
  const out: Array<{ title: string; link: string }> = [];
  items.forEach((it) => {
    if (out.length >= 5) return;
    const title = it.querySelector('title')?.textContent || '';
    const link = it.querySelector('link')?.textContent || (it.querySelector('link[href]')?.getAttribute('href')) || '#';
    out.push({ title, link });
  });
  return out;
}

export class NewsMonitorPanel extends Panel {
  private refreshInterval: number | null = null;

  constructor() {
    super({ id: 'news-monitor', title: t('panels.newsMonitor') || 'News Monitor' });
    this.loadAndSchedule();
  }

  private async loadAndRender() {
    try {
      const entries: Array<{ title: string; link: string }> = [];
      for (const url of FEEDS) {
        try {
          const proxy = `/api/rss-proxy?url=${encodeURIComponent(url)}`;
          const resp = await fetch(proxy);
          if (!resp.ok) continue;
          const text = await resp.text();
          const parsed = parseFeed(text);
          entries.push(...parsed);
        } catch {
          // ignore
        }
      }
      if (entries.length === 0) {
        this.showError(t('common.noNewsAvailable'));
        return;
      }
      const html = '<ul>' + entries.slice(0, 10).map(e => `<li><a href="${e.link}" target="_blank">${e.title}</a></li>`).join('') + '</ul>';
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
