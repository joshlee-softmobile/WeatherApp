import { LitElement, html, css } from 'lit';

const UV_LABELS = ['', '低', '中等', '高', '很高', '極高'];
const UV_CLASSES = ['', 'low', 'moderate', 'high', 'veryhigh', 'extreme'];

function getUVLevel(uv) {
  if (uv <= 2) return 1;
  if (uv <= 5) return 2;
  if (uv <= 7) return 3;
  if (uv <= 10) return 4;
  return 5;
}

export class UVDisplay extends LitElement {
  static properties = {
    uv: { type: Number }
  };

  constructor() {
    super();
    this.uv = 0;
  }

  static styles = css`
    :host {
      display: block;
    }
    .uv-section {
      margin-top: 16px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #555;
      margin-bottom: 8px;
    }
    .uv-display {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .uv-value {
      font-size: 28px;
      font-weight: 300;
      color: #333;
    }
    .uv-level {
      font-size: 13px;
      padding: 2px 10px;
      border-radius: 12px;
      color: #fff;
    }
    .uv-level.low { background: #27ae60; }
    .uv-level.moderate { background: #f39c12; }
    .uv-level.high { background: #e67e22; }
    .uv-level.veryhigh { background: #e74c3c; }
    .uv-level.extreme { background: #8e44ad; }
  `;

  render() {
    const uvLevel = getUVLevel(this.uv);
    const uvVal = Math.round(this.uv);

    return html`
      <div class="uv-section">
        <div class="section-title">紫外線指數</div>
        <div class="uv-display">
          <span class="uv-value">${uvVal}</span>
          <span class="uv-level ${UV_CLASSES[uvLevel]}">${UV_LABELS[uvLevel]}</span>
        </div>
      </div>
    `;
  }
}

customElements.define('uv-display', UVDisplay);
