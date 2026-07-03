export class WeatherController {
  constructor(host) {
    this.host = host;
    this.weatherData = [];
    this.loading = true;
    this.error = null;
    this.updating = false;
    this.updateStatus = '';
    this.lastUpdatedTime = '';

    this.pollIntervalId = null;
    this.statusTimeoutId = null;

    this.host.addController(this);
  }

  hostConnected() {
    this.fetchWeather();
    // Poll every 15 minutes
    this.pollIntervalId = setInterval(() => this.fetchWeather(), 15 * 60 * 1000);
  }

  hostDisconnected() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
    if (this.statusTimeoutId) {
      clearTimeout(this.statusTimeoutId);
    }
  }

  setStatus(status) {
    this.updateStatus = status;
    this.host.requestUpdate();
    
    if (this.statusTimeoutId) {
      clearTimeout(this.statusTimeoutId);
    }
    
    this.statusTimeoutId = setTimeout(() => {
      this.updateStatus = '';
      this.host.requestUpdate();
    }, 5000);
  }

  async fetchWeather(forceRefresh = false) {
    if (forceRefresh) {
      this.updating = true;
      this.setStatus('正在請求更新...');
      this.host.requestUpdate();
    } else {
      this.loading = true;
      this.error = null;
      this.host.requestUpdate();
    }

    try {
      let data;
      const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api/weather';

      if (forceRefresh) {
        // Trigger workflow execution (POST)
        const res = await fetch(API_ENDPOINT, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        
        const isCached = res.headers.get('X-Weather-Cached') === 'true';
        this.setStatus(isCached ? '已是最新資料 (5分鐘內免重複更新)' : '更新成功！');
      } else {
        // Standard fetch (GET)
        const res = await fetch(`${API_ENDPOINT}?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      }

      this.weatherData = data;
      this.loading = false;
      this.updating = false;
      
      const now = new Date();
      if (data && data.length > 0) {
        this.lastUpdatedTime = data[0].data.current.last_updated;
      } else {
        this.lastUpdatedTime = now.toLocaleString('zh-TW');
      }
      this.host.requestUpdate();
    } catch (err) {
      console.error('Error fetching weather:', err);
      if (forceRefresh) {
        this.setStatus(`更新失敗: ${err.message}`);
        this.updating = false;
      } else {
        this.error = err.message || '載入失敗';
        this.loading = false;
      }
      this.host.requestUpdate();
    }
  }
}
