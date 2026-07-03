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
      padding: var(--header-padding, 20px 16px);
      text-align: center;
    }

    header h1 { font-size: var(--header-title-size, 24px); margin-bottom: var(--header-title-mb, 8px); }

    .header-controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: var(--header-controls-gap, 10px 16px);
      font-size: var(--header-controls-size, 13px);
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
      /* Desktop / MacBook: auto-fill with generous card min-width */
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
      box-sizing: border-box;
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

    /* iPad landscape (1024px) — keep auto-fill, just tighten padding */
    @media (max-width: 1100px) {
      main {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }

    /* iPad portrait (768px) — 2-column, tighter */
    @media (max-width: 820px) {
      main {
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
        padding: 0 12px;
        margin: 16px auto;
      }
    }

    /* iPhone landscape (~667-768px) — 2 columns, compressed */
    @media (max-width: 767px) and (orientation: landscape) {
      main {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 0 10px;
        margin: 12px auto;
      }
    }

    /* iPhone portrait / small devices — single column */
    @media (max-width: 600px) {
      main {
        grid-template-columns: 1fr;
        gap: 14px;
        padding: 0 12px;
        margin: 14px auto;
      }
    }

    /* Extra-small iPhones (SE etc.) */
    @media (max-width: 390px) {
      main {
        padding: 0 8px;
        gap: 12px;
        margin: 10px auto;
      }
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
