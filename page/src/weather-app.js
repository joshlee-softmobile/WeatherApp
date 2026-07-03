import { LitElement, html, css } from 'lit';
import { WeatherController } from './weather-controller.js';

export class WeatherApp extends LitElement {
  constructor() {
    super();
    this.weather = new WeatherController(this);
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 20px;
      text-align: center;
    }

    header h1 { font-size: 24px; margin-bottom: 8px; }

    .header-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      font-size: 13px;
    }

    .update-time {
      font-size: 13px;
      color: #fff;
    }

    #refreshBtn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #fff;
      padding: 6px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
    }

    #refreshBtn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    #refreshBtn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .refresh-status {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }

    main {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 24px auto;
      padding: 0 16px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .loading {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 0;
      font-size: 18px;
      color: #888;
    }

    footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #aaa;
    }

    @media (max-width: 1100px) {
      main { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      main { grid-template-columns: 1fr; }
    }
  `;

  render() {
    return html`
      <header>
        <h1>台灣天氣資訊</h1>
        <div class="header-controls">
          ${this.weather.lastUpdatedTime ? html`
            <span class="update-time">資料時間：${this.weather.lastUpdatedTime}</span>
          ` : ''}
          
          <button 
            id="refreshBtn" 
            ?disabled=${this.weather.updating || this.weather.loading} 
            @click=${() => this.weather.fetchWeather(true)}
          >
            重新整理
          </button>
          
          ${this.weather.updateStatus ? html`
            <span class="refresh-status">${this.weather.updateStatus}</span>
          ` : ''}
        </div>
      </header>

      <main>
        ${this.weather.loading ? html`
          <div class="loading">載入中...</div>
        ` : this.weather.error ? html`
          <div class="loading">
            載入失敗：${this.weather.error}
            <button id="refreshBtn" style="margin-left: 10px; display: inline-block;" @click=${() => this.weather.fetchWeather()}>重試</button>
          </div>
        ` : html`
          ${this.weather.weatherData.map(item => html`
            <weather-card .name=${item.name} .data=${item.data}></weather-card>
          `)}
        `}
      </main>

      <footer>
        <p>資料來源：WeatherAPI.com | 每 10 分鐘自動更新</p>
      </footer>
    `;
  }
}

customElements.define('weather-app', WeatherApp);
