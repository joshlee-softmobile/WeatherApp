import { LitElement, html, css } from 'lit';

export class RainChart extends LitElement {
  static properties = {
    hours: { type: Array },
    startHour: { type: Number }
  };

  constructor() {
    super();
    this.hours = [];
    this.startHour = 0;
  }

  static styles = css`
    :host {
      display: block;
      margin-top: 16px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #555;
      margin-bottom: 8px;
    }
    .rain-chart {
      display: flex;
      align-items: flex-end;
      height: 80px;
      gap: 3px;
      margin-bottom: 4px;
    }
    .rain-bar-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
    }
    .rain-bar {
      width: 100%;
      border-radius: 3px 3px 0 0;
      min-height: 2px;
      transition: height 0.3s;
      background: linear-gradient(to top, #85c1e9, #2e86c1);
    }
    .rain-label {
      font-size: 9px;
      color: #999;
      margin-top: 2px;
      white-space: nowrap;
    }
    .rain-labels {
      display: flex;
      gap: 3px;
    }
    .rain-labels span {
      flex: 1;
      text-align: center;
      font-size: 10px;
      color: #888;
    }
  `;

  render() {
    if (!this.hours || this.hours.length === 0) return html``;

    const hoursToShow = 12;
    const items = [];
    const labelSpans = [];

    for (let i = 0; i < hoursToShow; i++) {
      const hourIdx = (this.startHour + i) % 24;
      const h = this.hours[hourIdx];
      if (!h) continue;

      const pop = h.chance_of_rain;
      items.push(html`
        <div class="rain-bar-wrap">
          <div class="rain-bar" style="height: ${pop}%"></div>
          <div class="rain-label">${pop}%</div>
        </div>
      `);

      labelSpans.push(html`
        <span>${hourIdx}:00</span>
      `);
    }

    return html`
      <div class="section-title">降雨機率</div>
      <div class="rain-chart">
        ${items}
      </div>
      <div class="rain-labels">
        ${labelSpans}
      </div>
    `;
  }
}

customElements.define('rain-chart', RainChart);
