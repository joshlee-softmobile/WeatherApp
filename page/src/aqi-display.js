import { LitElement, html, css } from 'lit';

const AQI_LABELS = ['', '良好', '中等', '對敏感族群不健康', '不健康', '非常不健康', '危害'];
const AQI_CLASSES = ['', 'good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'];
const AQI_RANGES = [0, 50, 100, 150, 200, 300, 500];

function aqiToValue(index) {
  if (index < 1) index = 1;
  if (index > 6) index = 6;
  const mid = (AQI_RANGES[index - 1] + AQI_RANGES[index]) / 2;
  return Math.round(mid);
}

export class AQIDisplay extends LitElement {
  static properties = {
    aqiIndex: { type: Number },
    airQuality: { type: Object }
  };

  constructor() {
    super();
    this.aqiIndex = 1;
    this.airQuality = {};
  }

  static styles = css`
    :host {
      display: block;
    }
    .aq-section {
      margin-top: var(--aq-section-mt, 16px);
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #555;
      margin-bottom: 8px;
    }
    .aqi-display {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .aqi-badge {
      font-size: var(--aqi-badge-size, 28px);
      font-weight: 300;
      color: #333;
    }
    .aqi-level {
      font-size: var(--aqi-level-size, 13px);
      padding: 2px 10px;
      border-radius: 12px;
      color: #fff;
    }
    .aqi-level.good { background: #27ae60; }
    .aqi-level.moderate { background: #f39c12; }
    .aqi-level.unhealthy-sensitive { background: #e67e22; }
    .aqi-level.unhealthy { background: #e74c3c; }
    .aqi-level.very-unhealthy { background: #884ea0; }
    .aqi-level.hazardous { background: #6c3483; }

    .aq-grid {
      display: grid;
      grid-template-columns: var(--aq-grid-cols, 1fr 1fr);
      gap: var(--aq-grid-gap, 6px 16px);
      font-size: var(--aq-grid-size, 13px);
    }
    .aq-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;
      min-width: 0;
    }
    .aq-item .label {
      color: #888;
      white-space: nowrap;
      margin-right: 4px;
    }
    .aq-item .value {
      font-weight: 500;
      color: #333;
      white-space: nowrap;
      text-align: right;
    }
  `;

  render() {
    const idx = this.aqiIndex || 1;
    const aqiVal = aqiToValue(idx);
    const labelClass = AQI_CLASSES[idx] || 'good';
    const labelText = AQI_LABELS[idx] || '良好';
    const aq = this.airQuality || {};

    return html`
      <div class="aq-section">
        <div class="section-title">空氣品質</div>
        <div class="aqi-display">
          <span class="aqi-badge">AQI ${aqiVal}</span>
          <span class="aqi-level ${labelClass}">${labelText}</span>
        </div>
        <div class="aq-grid">
          <div class="aq-item">
            <span class="label">PM2.5</span>
            <span class="value">${aq.pm2_5?.toFixed(1) ?? '-'} µg/m³</span>
          </div>
          <div class="aq-item">
            <span class="label">PM10</span>
            <span class="value">${aq.pm10?.toFixed(1) ?? '-'} µg/m³</span>
          </div>
          <div class="aq-item">
            <span class="label">O₃</span>
            <span class="value">${aq.o3?.toFixed(1) ?? '-'} µg/m³</span>
          </div>
          <div class="aq-item">
            <span class="label">NO₂</span>
            <span class="value">${aq.no2?.toFixed(1) ?? '-'} µg/m³</span>
          </div>
          <div class="aq-item">
            <span class="label">CO</span>
            <span class="value">${aq.co?.toFixed(1) ?? '-'} µg/m³</span>
          </div>
          <div class="aq-item">
            <span class="label">SO₂</span>
            <span class="value">${aq.so2?.toFixed(1) ?? '-'} µg/m³</span>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('aqi-display', AQIDisplay);
