class DeviceMockup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._currentTheme = 'light';
    this._mediaQuery = null;
  }

  static get observedAttributes() {
    return ['type', 'src', 'fallback', 'fallback-2', 'hover-src', 'hover-fallback', 'hover-fallback-2', 'alt', 'theme', 'padding', 'hover-padding', 'fit', 'hover-fit'];
  }

  connectedCallback() {
    this._detectTheme();
    this.render();
    this._setupMediaQueryListener();
  }

  disconnectedCallback() {
    if (this._mediaQuery) {
      this._mediaQuery.removeEventListener('change', this._handleThemeChange);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'theme') {
        this._detectTheme();
      }
      this.render();
    }
  }

  _detectTheme() {
    const themeAttr = this.getAttribute('theme') || 'auto';

    if (themeAttr === 'auto') {
      this._currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      this._currentTheme = themeAttr;
    }
  }

  _setupMediaQueryListener() {
    const themeAttr = this.getAttribute('theme') || 'auto';

    if (themeAttr === 'auto') {
      this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this._handleThemeChange = () => {
        this._detectTheme();
        this.render();
      };
      this._mediaQuery.addEventListener('change', this._handleThemeChange);
    }
  }

  _isVideoFile(src) {
    if (!src) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
    return videoExtensions.some(ext => src.toLowerCase().endsWith(ext));
  }

  _createMediaElement(sources, isHover = false, padding = '0', fit = '') {
    const mainSrc = sources[0];
    if (!mainSrc) return '';

    const isVideo = this._isVideoFile(mainSrc);
    const alt = this.getAttribute('alt') || '';
    const paddingClass = padding !== '0' ? `has-padding-${isHover ? 'hover' : 'main'}` : '';
    const fitClass = fit ? `has-fit-${isHover ? 'hover' : 'main'}` : '';

    if (isVideo) {
      return `
        <video
          class="device-media ${isHover ? 'hover-media' : ''} ${paddingClass} ${fitClass}"
          autoplay
          loop
          muted
          playsinline
          ${!isHover ? `aria-label="${alt}"` : ''}
          ${!isHover ? 'role="img"' : ''}
        >
          ${sources.map(src => {
            const ext = src.split('.').pop().toLowerCase();
            const mimeType = this._getMimeType(ext);
            return `<source src="${src}" type="${mimeType}">`;
          }).join('')}
          ${alt ? `<p>${alt}</p>` : ''}
        </video>
      `;
    } else {
      return `
        <picture class="${paddingClass}">
          ${sources.slice(0, -1).reverse().map(src => {
            const ext = src.split('.').pop().toLowerCase();
            const mimeType = this._getImageMimeType(ext);
            return mimeType ? `<source srcset="${src}" type="${mimeType}">` : '';
          }).join('')}
          <img
            class="device-media ${isHover ? 'hover-media' : ''} ${fitClass}"
            src="${sources[sources.length - 1]}"
            alt="${alt}"
            loading="lazy"
          >
        </picture>
      `;
    }
  }

  _getMimeType(ext) {
    const mimeTypes = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'm4v': 'video/x-m4v'
    };
    return mimeTypes[ext] || 'video/mp4';
  }

  _getImageMimeType(ext) {
    const mimeTypes = {
      'avif': 'image/avif',
      'webp': 'image/webp',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || null;
  }

  _getMediaSources() {
    const sources = [];
    const src = this.getAttribute('src');
    const fallback = this.getAttribute('fallback');
    const fallback2 = this.getAttribute('fallback-2');

    if (src) sources.push(src);
    if (fallback) sources.push(fallback);
    if (fallback2) sources.push(fallback2);

    return sources;
  }

  _getHoverMediaSources() {
    const sources = [];
    const hoverSrc = this.getAttribute('hover-src');
    const hoverFallback = this.getAttribute('hover-fallback');
    const hoverFallback2 = this.getAttribute('hover-fallback-2');

    if (hoverSrc) sources.push(hoverSrc);
    if (hoverFallback) sources.push(hoverFallback);
    if (hoverFallback2) sources.push(hoverFallback2);

    return sources;
  }

  render() {
    const type = this.getAttribute('type') || 'laptop';
    const mediaSources = this._getMediaSources();
    const hoverMediaSources = this._getHoverMediaSources();
    const hasHover = hoverMediaSources.length > 0;
    const padding = this.getAttribute('padding') || '0';
    const hoverPadding = this.getAttribute('hover-padding') || padding;
    const fit = this.getAttribute('fit') || '';
    const hoverFit = this.getAttribute('hover-fit') || '';

    if (mediaSources.length === 0) {
      console.warn('device-mockup: No media sources provided');
      return;
    }

    const mediaElement = this._createMediaElement(mediaSources, false, padding, fit);
    const hoverMediaElement = hasHover ? this._createMediaElement(hoverMediaSources, true, hoverPadding, hoverFit) : '';

    let template;
    if (type === 'phone') {
      template = this._getPhoneTemplate(mediaElement, hoverMediaElement, hasHover);
    } else if (type === 'tablet') {
      template = this._getTabletTemplate(mediaElement, hoverMediaElement, hasHover);
    } else {
      template = this._getLaptopTemplate(mediaElement, hoverMediaElement, hasHover);
    }

    this.shadowRoot.innerHTML = `
      <style>${this._getStyles(padding, hoverPadding, fit, hoverFit)}</style>
      ${template}
    `;
  }

  _getLaptopTemplate(mediaElement, hoverMediaElement, hasHover) {
    return `
      <div class="device-container laptop-container ${hasHover ? 'has-hover' : ''}">
        <div class="laptop-mockup">
          <div class="laptop-frame">
            <div class="laptop-screen">
              ${mediaElement}
              ${hasHover ? hoverMediaElement : ''}
            </div>
          </div>
          <div class="laptop-base"></div>
        </div>
      </div>
    `;
  }

  _getPhoneTemplate(mediaElement, hoverMediaElement, hasHover) {
    return `
      <div class="device-container phone-container ${hasHover ? 'has-hover' : ''}">
        <div class="phone-mockup">
          <div class="phone-frame">
            <div class="phone-screen">
              ${mediaElement}
              ${hasHover ? hoverMediaElement : ''}
            </div>
            <div class="phone-home-indicator"></div>
          </div>
        </div>
      </div>
    `;
  }

  _getTabletTemplate(mediaElement, hoverMediaElement, hasHover) {
    return `
      <div class="device-container tablet-container ${hasHover ? 'has-hover' : ''}">
        <div class="tablet-mockup">
          <div class="tablet-frame">
            <div class="tablet-screen">
              ${mediaElement}
              ${hasHover ? hoverMediaElement : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _getStyles(padding = '0', hoverPadding = '0', fit = '', hoverFit = '') {
    const isDark = this._currentTheme === 'dark';
    const hasPadding = padding !== '0';
    const hasHoverPadding = hoverPadding !== '0';
    const paddingDouble = hasPadding ? `calc(${padding} * 2)` : '0';
    const hoverPaddingDouble = hasHoverPadding ? `calc(${hoverPadding} * 2)` : '0';

    return `
      :host {
        display: inline-block;
        --device-scale: 1;

        /* Default colors - can be overridden with CSS custom properties */
        --frame-color: ${isDark ? '#6b7280' : '#1f2937'};
        --frame-dark: ${isDark ? '#4b5563' : '#111827'};
        --screen-bg: ${isDark ? '#9ca3af' : '#000'};
        --base-color: ${isDark ? '#9ca3af' : '#374151'};
        --base-dark: ${isDark ? '#6b7280' : '#1f2937'};
        --shadow-color: ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.6)'};
      }

      * {
        box-sizing: border-box;
      }

      .device-container {
        position: relative;
        display: inline-block;
        transform: scale(var(--device-scale));
        transform-origin: center;
      }

      /* Laptop Styles */
      .laptop-mockup {
        position: relative;
      }

      .laptop-frame {
        width: 320px;
        height: 200px;
        background: var(--frame-color);
        border-radius: 12px 12px 4px 4px;
        padding: 8px 8px 20px;
        box-shadow: 0 25px 50px -12px var(--shadow-color);
        position: relative;
      }

      .laptop-screen {
        width: 100%;
        height: 100%;
        background: transparent;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      }

      .laptop-base {
        width: 340px;
        height: 20px;
        background: linear-gradient(to bottom, var(--base-color), var(--frame-color));
        border-radius: 0 0 20px 20px;
        margin: -4px auto 0;
        box-shadow: 0 8px 16px -4px var(--shadow-color);
        position: relative;
      }

      .laptop-base::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        height: 14px;
        background: linear-gradient(to bottom, var(--base-color), var(--base-dark));
        border-radius: 8px;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
      }

      .laptop-base::after {
        content: '';
        position: absolute;
        top: 5px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 8px;
        background: var(--frame-color);
        border-radius: 4px;
        box-shadow: inset 0 1px 1px rgba(0,0,0,0.4);
      }

      /* Phone Styles */
      .phone-mockup {
        position: relative;
      }

      .phone-frame {
        width: 180px;
        height: 360px;
        background: var(--frame-color);
        border-radius: 24px;
        padding: 4px 12px 12px 12px;
        box-shadow: 0 25px 50px -12px var(--shadow-color);
        position: relative;
      }

      .phone-frame::before {
        content: '';
        position: absolute;
        top: 6px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 3px;
        background: var(--frame-dark);
        border-radius: 2px;
      }

      .phone-screen {
        width: 100%;
        height: calc(100% - 20px);
        background: transparent;
        border-radius: 20px;
        overflow: hidden;
        margin-top: 10px;
        position: relative;
      }

      .phone-home-indicator {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 4px;
        background: var(--base-color);
        border-radius: 2px;
      }

      /* Tablet Styles */
      .tablet-mockup {
        position: relative;
      }

      .tablet-frame {
        width: 260px;
        height: 340px;
        background: var(--frame-color);
        border-radius: 20px;
        padding: 12px;
        box-shadow: 0 25px 50px -12px var(--shadow-color);
        position: relative;
      }

      .tablet-frame::before {
        content: '';
        position: absolute;
        top: 3px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 8px;
        background: var(--frame-dark);
        border-radius: 50%;
      }

      .tablet-screen {
        width: 100%;
        height: 100%;
        background: transparent;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
      }

      /* Media Styles */
      .device-media {
        width: 100%;
        height: 100%;
        display: block;
      }

      picture {
        display: block;
        width: 100%;
        height: 100%;
      }

      picture.has-padding-main {
        width: calc(100% - ${paddingDouble});
        height: calc(100% - ${paddingDouble});
        margin: ${padding};
      }

      picture.has-padding-hover {
        width: calc(100% - ${hoverPaddingDouble});
        height: calc(100% - ${hoverPaddingDouble});
        margin: ${hoverPadding};
      }

      video.has-padding-main {
        width: calc(100% - ${paddingDouble});
        height: calc(100% - ${paddingDouble});
        margin: ${padding};
      }

      video.has-padding-hover {
        width: calc(100% - ${hoverPaddingDouble});
        height: calc(100% - ${hoverPaddingDouble});
        margin: ${hoverPadding};
      }

      .has-padding-main img,
      .has-padding-hover img {
        width: 100%;
        height: 100%;
      }

      /* Object-fit Styles */
      .has-fit-main {
        object-fit: ${fit || 'none'};
      }

      .has-fit-hover {
        object-fit: ${hoverFit || 'none'};
      }

      /* Hover State */
      .hover-media {
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .has-hover:hover .hover-media {
        opacity: 1;
      }

      .has-hover:hover .device-media:not(.hover-media) {
        opacity: 0;
      }

      /* Responsive Scaling */
      @media (max-width: 768px) {
        .laptop-frame {
          width: 280px;
          height: 175px;
        }

        .laptop-base {
          width: 300px;
        }

        .phone-frame {
          width: 160px;
          height: 320px;
        }

        .tablet-frame {
          width: 220px;
          height: 300px;
        }
      }

      @media (max-width: 480px) {
        .laptop-frame {
          width: 240px;
          height: 150px;
        }

        .laptop-base {
          width: 260px;
        }

        .phone-frame {
          width: 140px;
          height: 280px;
        }

        .tablet-frame {
          width: 180px;
          height: 250px;
        }
      }
    `;
  }
}

// Register the custom element
customElements.define('device-mockup', DeviceMockup);
