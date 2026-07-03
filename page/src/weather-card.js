import { LitElement, html, css } from 'lit';

const CN2TW = {
  '小阵雨': '小陣雨', '局部多云': '局部多雲', '薄雾': '薄霧', '烟霾': '煙霾',
  '霾': '霾', '阴天': '陰天', '晴天': '晴天', '阵雨': '陣雨',
  '小雨': '小雨', '局部小毛毛雨': '局部小毛毛雨', '局部小雨': '局部小雨',
  '附近局部降雨': '鄰近局部降雨', '中雨': '中雨', '大雨': '大雨',
  '雷雨': '雷雨', '大雷雨': '大雷雨', '多云': '多雲', '局部降雨': '局部降雨',
  '附近有雷暴': '鄰近有雷暴', '局部毛毛雨': '局部毛毛雨', '毛毛雨': '毛毛雨',
  '小阵雪': '小陣雪', '晴': '晴', '晴时多云': '晴時多雲',
  '多云时晴': '多雲時晴', '多云短暂阵雨': '多雲短暫陣雨'
};

function toTW(text) {
  return CN2TW[text] || text;
}

export class WeatherCard extends LitElement {
  static properties = {
    name: { type: String },
    data: { type: Object }
  };

  constructor() {
    super();
    this.name = '';
    this.data = null;
  }

  static styles = css`
    :host {
      display: block;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      padding: 24px;
      transition: box-shadow 0.2s;
    }
    .card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .card-header h2 {
      font-size: 20px;
      color: #333;
      margin: 0;
    }
    .card-header img {
      width: 48px;
      height: 48px;
    }
    .card-header .condition-text {
      font-size: 14px;
      color: #666;
    }
    .temp-section {
      text-align: center;
      margin-bottom: 20px;
    }
    .temp-current {
      font-size: 56px;
      font-weight: 300;
      line-height: 1;
      color: #333;
    }
    .temp-current .unit {
      font-size: 24px;
    }
    .temp-detail {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 8px;
      font-size: 14px;
      color: #666;
    }
    .temp-detail .feels-like {
      color: #888;
    }
    .temp-detail .high {
      color: #e74c3c;
    }
    .temp-detail .low {
      color: #3498db;
    }
  `;

  render() {
    if (!this.data) return html``;

    const current = this.data.current;
    const day = this.data.forecast.forecastday[0];
    const now = new Date();
    const currentHour = now.getHours();

    return html`
      <div class="card">
        <div class="card-header">
          <h2>${this.name}</h2>
          <img src="https:${current.condition.icon}" alt="${current.condition.text}">
          <span class="condition-text">${toTW(current.condition.text)}</span>
        </div>

        <div class="temp-section">
          <div class="temp-current">
            ${Math.round(current.temp_c)}<span class="unit">°C</span>
          </div>
          <div class="temp-detail">
            <span class="feels-like">體感 ${Math.round(current.feelslike_c)}°C</span>
            <span class="high">↑ ${Math.round(day.day.maxtemp_c)}°C</span>
            <span class="low">↓ ${Math.round(day.day.mintemp_c)}°C</span>
          </div>
        </div>

        <rain-chart .hours=${day.hour} .startHour=${currentHour}></rain-chart>

        <uv-display .uv=${current.uv}></uv-display>

        <aqi-display .aqiIndex=${current.air_quality['us-epa-index']} .airQuality=${current.air_quality}></aqi-display>
      </div>
    `;
  }
}

customElements.define('weather-card', WeatherCard);
