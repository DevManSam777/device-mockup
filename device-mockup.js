class DeviceMockup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._currentTheme = 'light';
    this._mediaQuery = null;
  }

  static get observedAttributes() {
    return ['type', 'src', 'fallback', 'fallback-2', 'hover-src', 'hover-fallback', 'hover-fallback-2', 'alt', 'theme', 'padding', 'hover-padding', 'fit', 'hover-fit', 'href', 'target', 'frame-color', 'frame-dark', 'base-color', 'base-dark', 'shadow-color', 'width', 'height'];
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

  _calculateScale() {
    const type = this.getAttribute('type') || 'laptop';
    const customWidth = this.getAttribute('width');
    const customHeight = this.getAttribute('height');

    // Base dimensions for each device type (widest element)
    const baseDimensions = {
      'laptop': { width: 238, height: 154 }, // laptop-base is 238px wide, total height ~154px
      'phone': { width: 126, height: 252 },
      'tablet': { width: 182, height: 238 }
    };

    const base = baseDimensions[type] || baseDimensions.laptop;

    // If custom width is specified, calculate scale based on width
    if (customWidth) {
      // Remove 'px' suffix if present and parse as number
      const targetWidth = parseFloat(customWidth.toString().replace('px', ''));
      return targetWidth / base.width;
    }

    // If custom height is specified, calculate scale based on height
    if (customHeight) {
      // Remove 'px' suffix if present and parse as number
      const targetHeight = parseFloat(customHeight.toString().replace('px', ''));
      return targetHeight / base.height;
    }

    // No custom sizing, return 1 (will use --device-scale CSS variable if set)
    return null;
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
    const href = this.getAttribute('href');
    const target = this.getAttribute('target') || '_blank';
    const content = `
      <div class="laptop-mockup">
        <div class="laptop-frame">
          <div class="laptop-screen">
            ${mediaElement}
            ${hasHover ? hoverMediaElement : ''}
          </div>
        </div>
        <div class="laptop-base"></div>
      </div>
    `;

    if (href) {
      return `
        <a href="${href}" target="${target}" class="device-link">
          <div class="device-container laptop-container ${hasHover ? 'has-hover' : ''}">
            ${content}
          </div>
        </a>
      `;
    }

    return `
      <div class="device-container laptop-container ${hasHover ? 'has-hover' : ''}">
        ${content}
      </div>
    `;
  }

  _getPhoneTemplate(mediaElement, hoverMediaElement, hasHover) {
    const href = this.getAttribute('href');
    const target = this.getAttribute('target') || '_blank';
    const content = `
      <div class="phone-mockup">
        <div class="phone-frame">
          <div class="phone-screen">
            ${mediaElement}
            ${hasHover ? hoverMediaElement : ''}
          </div>
          <div class="phone-home-indicator"></div>
        </div>
      </div>
    `;

    if (href) {
      return `
        <a href="${href}" target="${target}" class="device-link">
          <div class="device-container phone-container ${hasHover ? 'has-hover' : ''}">
            ${content}
          </div>
        </a>
      `;
    }

    return `
      <div class="device-container phone-container ${hasHover ? 'has-hover' : ''}">
        ${content}
      </div>
    `;
  }

  _getTabletTemplate(mediaElement, hoverMediaElement, hasHover) {
    const href = this.getAttribute('href');
    const target = this.getAttribute('target') || '_blank';
    const content = `
      <div class="tablet-mockup">
        <div class="tablet-frame">
          <div class="tablet-screen">
            ${mediaElement}
            ${hasHover ? hoverMediaElement : ''}
          </div>
        </div>
      </div>
    `;

    if (href) {
      return `
        <a href="${href}" target="${target}" class="device-link">
          <div class="device-container tablet-container ${hasHover ? 'has-hover' : ''}">
            ${content}
          </div>
        </a>
      `;
    }

    return `
      <div class="device-container tablet-container ${hasHover ? 'has-hover' : ''}">
        ${content}
      </div>
    `;
  }

  _getStyles(padding = '0', hoverPadding = '0', fit = '', hoverFit = '') {
    const isDark = this._currentTheme === 'dark';
    const hasPadding = padding !== '0';
    const hasHoverPadding = hoverPadding !== '0';
    const paddingDouble = hasPadding ? `calc(${padding} * 2)` : '0';
    const hoverPaddingDouble = hasHoverPadding ? `calc(${hoverPadding} * 2)` : '0';

    // Get color attributes or use defaults
    const frameColor = this.getAttribute('frame-color') || (isDark ? '#6b7280' : '#1f2937');
    const frameDark = this.getAttribute('frame-dark') || (isDark ? '#4b5563' : '#111827');
    const baseColor = this.getAttribute('base-color') || (isDark ? '#9ca3af' : '#374151');
    const baseDark = this.getAttribute('base-dark') || (isDark ? '#6b7280' : '#1f2937');
    const shadowColor = this.getAttribute('shadow-color') || (isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.6)');

    // Calculate scale from width/height attributes if provided
    const calculatedScale = this._calculateScale();
    const defaultScale = calculatedScale !== null ? calculatedScale : 1;

    return `
      :host {
        display: inline-block;
        --device-scale: ${defaultScale};
        overflow: visible;

        /* Colors - can be set via attributes or overridden with CSS custom properties */
        --frame-color: ${frameColor};
        --frame-dark: ${frameDark};
        --screen-bg: ${isDark ? '#9ca3af' : '#000'};
        --base-color: ${baseColor};
        --base-dark: ${baseDark};
        --shadow-color: ${shadowColor};
      }

      * {
        box-sizing: border-box;
      }

      .device-link {
        text-decoration: none;
        color: inherit;
        display: inline-block;
        cursor: pointer;
        overflow: visible;
      }

      .device-link:hover .device-container {
        transform: scale(calc(var(--device-scale) * 1.02));
        transition: transform 0.3s ease;
      }

      .device-container {
        position: relative;
        display: inline-block;
        transform: scale(var(--device-scale));
        transform-origin: top center;
        overflow: visible;
      }

      /* Laptop Styles */
      .laptop-mockup {
        position: relative;
        width: 238px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .laptop-frame {
        width: 224px;
        height: 140px;
        background: var(--frame-color);
        border-radius: 8px 8px 3px 3px;
        padding: 6px 6px 14px;
        box-shadow: 0 18px 35px -8px var(--shadow-color);
        position: relative;
      }

      .laptop-screen {
        width: 100%;
        height: 100%;
        background: transparent;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .laptop-base {
        width: 238px;
        height: 14px;
        background: linear-gradient(to bottom, var(--base-color), var(--frame-color));
        border-radius: 0 0 14px 14px;
        margin-top: -3px;
        box-shadow: 0 6px 12px -3px var(--shadow-color);
        position: relative;
      }

      .laptop-base::before {
        content: '';
        position: absolute;
        top: 1px;
        left: 50%;
        transform: translateX(-50%);
        width: 210px;
        height: 10px;
        background: linear-gradient(to bottom, var(--base-color), var(--base-dark));
        border-radius: 6px;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
      }

      .laptop-base::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 50%;
        transform: translateX(-50%);
        width: 56px;
        height: 6px;
        background: var(--frame-color);
        border-radius: 3px;
        box-shadow: inset 0 1px 1px rgba(0,0,0,0.4);
      }

      /* Phone Styles */
      .phone-mockup {
        position: relative;
      }

      .phone-frame {
        width: 126px;
        height: 252px;
        background: var(--frame-color);
        border-radius: 17px;
        padding: 3px 8px 8px 8px;
        box-shadow: 0 18px 35px -8px var(--shadow-color);
        position: relative;
      }

      .phone-frame::before {
        content: '';
        position: absolute;
        top: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 42px;
        height: 2px;
        background: var(--frame-dark);
        border-radius: 1px;
      }

      .phone-screen {
        width: 100%;
        height: calc(100% - 14px);
        background: transparent;
        border-radius: 14px;
        overflow: hidden;
        margin-top: 7px;
        position: relative;
      }

      .phone-home-indicator {
        position: absolute;
        bottom: 6px;
        left: 50%;
        transform: translateX(-50%);
        width: 28px;
        height: 3px;
        background: var(--base-color);
        border-radius: 2px;
      }

      /* Tablet Styles */
      .tablet-mockup {
        position: relative;
      }

      .tablet-frame {
        width: 182px;
        height: 238px;
        background: var(--frame-color);
        border-radius: 14px;
        padding: 8px;
        box-shadow: 0 18px 35px -8px var(--shadow-color);
        position: relative;
      }

      .tablet-frame::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        background: var(--frame-dark);
        border-radius: 50%;
      }

      .tablet-screen {
        width: 100%;
        height: 100%;
        background: transparent;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
      }

      /* Media Styles */
      .device-media {
        width: 100%;
        height: 100%;
        display: block;
        pointer-events: none;
      }

      picture {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
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
    `;
  }
}

// Register the custom element
customElements.define('device-mockup', DeviceMockup);
