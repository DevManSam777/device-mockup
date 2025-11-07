class DeviceMockup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._currentTheme = "light";
    this._mediaQuery = null;
  }

  static get observedAttributes() {
    return [
      "type",
      "src",
      "fallback",
      "fallback-2",
      "hover-src",
      "hover-fallback",
      "hover-fallback-2",
      "alt",
      "theme",
      "padding",
      "hover-padding",
      "fit",
      "hover-fit",
      "href",
      "target",
      "mode",
      "bezel-color",
      "camera-color",
      "keyboard-color",
      "keyboard-gradient",
      "shadow-color",
      "screen-background",
      "width",
      "height",
      // Deprecated - kept for backward compatibility
      "frame-color",
      "frame-dark",
      "base-color",
      "base-dark",
      "screen-bg",
    ];
  }

  connectedCallback() {
    this._detectTheme();
    this.render();
    this._setupMediaQueryListener();
  }

  disconnectedCallback() {
    if (this._mediaQuery) {
      this._mediaQuery.removeEventListener("change", this._handleThemeChange);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "theme") {
        this._detectTheme();
      }
      this.render();
    }
  }

  _detectTheme() {
    const themeAttr = this.getAttribute("theme") || "auto";

    if (themeAttr === "auto") {
      this._currentTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
    } else {
      this._currentTheme = themeAttr;
    }
  }

  _calculateScale() {
    const type = this.getAttribute("type") || "laptop";
    const customWidth = this.getAttribute("width");
    const customHeight = this.getAttribute("height");

    // Base dimensions for each device type (widest element)
    const baseDimensions = {
      laptop: { width: 238, height: 154 }, // laptop-base is 238px wide, total height ~154px
      phone: { width: 126, height: 252 },
      tablet: { width: 182, height: 238 },
    };

    const base = baseDimensions[type] || baseDimensions.laptop;

    // If custom width is specified, calculate scale based on width
    if (customWidth) {
      // Remove 'px' suffix if present and parse as number
      const targetWidth = parseFloat(customWidth.toString().replace("px", ""));
      return targetWidth / base.width;
    }

    // If custom height is specified, calculate scale based on height
    if (customHeight) {
      // Remove 'px' suffix if present and parse as number
      const targetHeight = parseFloat(
        customHeight.toString().replace("px", "")
      );
      return targetHeight / base.height;
    }

    // No custom sizing, return 1 (will use --device-scale CSS variable if set)
    return null;
  }

  _setupMediaQueryListener() {
    const themeAttr = this.getAttribute("theme") || "auto";

    if (themeAttr === "auto") {
      this._mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      this._handleThemeChange = () => {
        this._detectTheme();
        this.render();
      };
      this._mediaQuery.addEventListener("change", this._handleThemeChange);
    }
  }

  _isVideoFile(src) {
    if (!src) return false;
    const videoExtensions = [
      ".mp4",
      ".webm",
      ".ogg",
      ".mov",
      ".avi",
      ".mkv",
      ".m4v",
    ];
    return videoExtensions.some((ext) => src.toLowerCase().endsWith(ext));
  }

  _createMediaElement(sources, isHover = false, padding = "0", fit = "") {
    const mainSrc = sources[0];
    if (!mainSrc) return "";

    const isVideo = this._isVideoFile(mainSrc);
    const alt = this.getAttribute("alt") || "";
    const paddingClass =
      padding !== "0" ? `has-padding-${isHover ? "hover" : "main"}` : "";
    const fitClass = fit ? `has-fit-${isHover ? "hover" : "main"}` : "";

    if (isVideo) {
      return `
        <video
          class="device-media ${
            isHover ? "hover-media" : ""
          } ${paddingClass} ${fitClass}"
          autoplay
          loop
          muted
          playsinline
          ${!isHover ? `aria-label="${alt}"` : ""}
          ${!isHover ? 'role="img"' : ""}
        >
          ${sources
            .map((src) => {
              const ext = src.split(".").pop().toLowerCase();
              const mimeType = this._getMimeType(ext);
              return `<source src="${src}" type="${mimeType}">`;
            })
            .join("")}
          ${alt ? `<p>${alt}</p>` : ""}
        </video>
      `;
    } else {
      return `
        <picture class="${paddingClass}">
          ${sources
            .slice(0, -1)
            .reverse()
            .map((src) => {
              const ext = src.split(".").pop().toLowerCase();
              const mimeType = this._getImageMimeType(ext);
              return mimeType
                ? `<source srcset="${src}" type="${mimeType}">`
                : "";
            })
            .join("")}
          <img
            class="device-media ${isHover ? "hover-media" : ""} ${fitClass}"
            src="${sources[sources.length - 1]}"
            alt="${alt}"
            loading="lazy"
          >
        </picture>
      `;
    }
  }

  _createIframeElement(url, padding = "0") {
    const paddingClass = padding !== "0" ? "has-padding-main" : "";
    const target = this.getAttribute("target") || "_self";
    return `
      <iframe
        class="device-media device-iframe ${paddingClass}"
        name="${target}"
        src="${url}"
        frameborder="0"
        loading="lazy"
        title="${this.getAttribute("alt") || "Website preview"}"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-top-navigation-by-user-activation allow-downloads allow-modals"
      ></iframe>
    `;
  }

  _getMimeType(ext) {
    const mimeTypes = {
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mkv: "video/x-matroska",
      m4v: "video/x-m4v",
    };
    return mimeTypes[ext] || "video/mp4";
  }

  _getImageMimeType(ext) {
    const mimeTypes = {
      avif: "image/avif",
      webp: "image/webp",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
    };
    return mimeTypes[ext] || null;
  }

  _getMediaSources() {
    const sources = [];
    const src = this.getAttribute("src");
    const fallback = this.getAttribute("fallback");
    const fallback2 = this.getAttribute("fallback-2");

    if (src) sources.push(src);
    if (fallback) sources.push(fallback);
    if (fallback2) sources.push(fallback2);

    return sources;
  }

  _getHoverMediaSources() {
    const sources = [];
    const hoverSrc = this.getAttribute("hover-src");
    const hoverFallback = this.getAttribute("hover-fallback");
    const hoverFallback2 = this.getAttribute("hover-fallback-2");

    if (hoverSrc) sources.push(hoverSrc);
    if (hoverFallback) sources.push(hoverFallback);
    if (hoverFallback2) sources.push(hoverFallback2);

    return sources;
  }

  render() {
    const type = this.getAttribute("type") || "laptop";
    const mode = this.getAttribute("mode");
    const href = this.getAttribute("href");
    const mediaSources = this._getMediaSources();
    const hoverMediaSources = this._getHoverMediaSources();
    const hasHover = hoverMediaSources.length > 0;
    const padding = this.getAttribute("padding") || "0";
    const hoverPadding = this.getAttribute("hover-padding") || padding;
    const fit = this.getAttribute("fit") || "";
    const hoverFit = this.getAttribute("hover-fit") || "";

    let mediaElement;

    // If mode is iframe, use iframe instead of image/video
    if (mode === "iframe" && href) {
      mediaElement = this._createIframeElement(href, padding);
    } else {
      if (mediaSources.length === 0) {
        console.warn("device-mockup: No media sources provided");
        return;
      }
      mediaElement = this._createMediaElement(
        mediaSources,
        false,
        padding,
        fit
      );
    }

    const hoverMediaElement = hasHover
      ? this._createMediaElement(
          hoverMediaSources,
          true,
          hoverPadding,
          hoverFit
        )
      : "";

    let template;
    if (type === "phone") {
      template = this._getPhoneTemplate(
        mediaElement,
        hoverMediaElement,
        hasHover
      );
    } else if (type === "tablet") {
      template = this._getTabletTemplate(
        mediaElement,
        hoverMediaElement,
        hasHover
      );
    } else {
      template = this._getLaptopTemplate(
        mediaElement,
        hoverMediaElement,
        hasHover
      );
    }

    this.shadowRoot.innerHTML = `
      <style>${this._getStyles(padding, hoverPadding, fit, hoverFit)}</style>
      ${template}
    `;
  }

  _getLaptopTemplate(mediaElement, hoverMediaElement, hasHover) {
    const href = this.getAttribute("href");
    const target = this.getAttribute("target") || "_blank";
    const mode = this.getAttribute("mode");
    const content = `
      <div class="laptop-mockup">
        <div class="laptop-frame">
          <div class="laptop-screen">
            ${mediaElement}
            ${hasHover ? hoverMediaElement : ""}
          </div>
        </div>
        <div class="laptop-base"></div>
      </div>
    `;

    // If iframe mode, don't wrap in link - iframe is the content
    if (mode === "iframe") {
      return `
        <div class="device-container laptop-container ${
          hasHover ? "has-hover" : ""
        }">
          ${content}
        </div>
      `;
    }

    if (href) {
      return `
        <a href="${href}" target="${target}" class="device-link">
          <div class="device-container laptop-container ${
            hasHover ? "has-hover" : ""
          }">
            ${content}
          </div>
        </a>
      `;
    }

    return `
      <div class="device-container laptop-container ${
        hasHover ? "has-hover" : ""
      }">
        ${content}
      </div>
    `;
  }

  _getPhoneTemplate(mediaElement, hoverMediaElement, hasHover) {
    const href = this.getAttribute("href");
    const target = this.getAttribute("target") || "_blank";
    const mode = this.getAttribute("mode");
    const content = `
      <div class="phone-mockup">
        <div class="phone-frame">
          <div class="phone-screen">
            ${mediaElement}
            ${hasHover ? hoverMediaElement : ""}
          </div>
          <div class="phone-home-indicator"></div>
        </div>
      </div>
    `;

    // If iframe mode, don't wrap in link - iframe is the content
    if (mode === "iframe") {
      return `
        <div class="device-container phone-container ${
          hasHover ? "has-hover" : ""
        }">
          ${content}
        </div>
      `;
    }

    if (href) {
      return `
        <a href="${href}" target="${target}" class="device-link">
          <div class="device-container phone-container ${
            hasHover ? "has-hover" : ""
          }">
            ${content}
          </div>
        </a>
      `;
    }

    return `
      <div class="device-container phone-container ${
        hasHover ? "has-hover" : ""
      }">
        ${content}
      </div>
    `;
  }

  _getTabletTemplate(mediaElement, hoverMediaElement, hasHover) {
    const href = this.getAttribute("href");
    const target = this.getAttribute("target") || "_blank";
    const mode = this.getAttribute("mode");
    const content = `
      <div class="tablet-mockup">
        <div class="tablet-frame">
          <div class="tablet-screen">
            ${mediaElement}
            ${hasHover ? hoverMediaElement : ""}
          </div>
        </div>
      </div>
    `;

    // If iframe mode, don't wrap in link - iframe is the content
    if (mode === "iframe") {
      return `
        <div class="device-container tablet-container ${
          hasHover ? "has-hover" : ""
        }">
          ${content}
        </div>
      `;
    }

    if (href) {
      return `
        <a href="${href}" target="${target}" class="device-link">
          <div class="device-container tablet-container ${
            hasHover ? "has-hover" : ""
          }">
            ${content}
          </div>
        </a>
      `;
    }

    return `
      <div class="device-container tablet-container ${
        hasHover ? "has-hover" : ""
      }">
        ${content}
      </div>
    `;
  }

  _getStyles(padding = "0", hoverPadding = "0", fit = "", hoverFit = "") {
    const isDark = this._currentTheme === "dark";
    const hasPadding = padding !== "0";
    const hasHoverPadding = hoverPadding !== "0";
    const paddingDouble = hasPadding ? `calc(${padding} * 2)` : "0";
    const hoverPaddingDouble = hasHoverPadding
      ? `calc(${hoverPadding} * 2)`
      : "0";

    // Get color from style attribute CSS variables, then attributes, then defaults
    // Support both new and deprecated attribute names for backward compatibility
    const getColor = (cssVar, attrName, deprecatedAttr, lightDefault, darkDefault) => {
      const customValue = this.style.getPropertyValue(cssVar).trim();
      if (customValue) return customValue;

      const newAttrValue = this.getAttribute(attrName);
      if (newAttrValue) return newAttrValue;

      // Check for deprecated attribute and warn
      const deprecatedValue = this.getAttribute(deprecatedAttr);
      if (deprecatedValue) {
        console.warn(`device-mockup: "${deprecatedAttr}" is deprecated. Use "${attrName}" instead.`);
        return deprecatedValue;
      }

      return isDark ? darkDefault : lightDefault;
    };

    const bezelColor = getColor('--bezel-color', 'bezel-color', 'frame-color', '#1f2937', '#6b7280');
    const cameraColor = getColor('--camera-color', 'camera-color', 'frame-dark', '#111827', '#4b5563');
    const keyboardColor = getColor('--keyboard-color', 'keyboard-color', 'base-color', '#374151', '#9ca3af');
    const keyboardGradient = getColor('--keyboard-gradient', 'keyboard-gradient', 'base-dark', '#1f2937', '#6b7280');
    const shadowColor = getColor('--shadow-color', 'shadow-color', 'shadow-color', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.4)');
    const screenBackground = getColor('--screen-background', 'screen-background', 'screen-bg', 'transparent', 'transparent');

    // Calculate scale from width/height attributes if provided
    const calculatedScale = this._calculateScale();
    const defaultScale = calculatedScale !== null ? calculatedScale : 1;

    // Calculate actual dimensions for layout
    const type = this.getAttribute("type") || "laptop";
    const baseDimensions = {
      laptop: { width: 238, height: 154 },
      phone: { width: 126, height: 252 },
      tablet: { width: 182, height: 238 },
    };
    const base = baseDimensions[type] || baseDimensions.laptop;
    const actualWidth = base.width * defaultScale;
    const actualHeight = base.height * defaultScale;

    return `
      :host {
        display: inline-block;
        --device-scale: ${defaultScale};
        width: ${actualWidth}px;
        height: ${actualHeight}px;
        overflow: visible;

        /* Colors - can be set via attributes or overridden with CSS custom properties */
        --bezel-color: ${bezelColor};
        --camera-color: ${cameraColor};
        --screen-background: ${screenBackground};
        --keyboard-color: ${keyboardColor};
        --keyboard-gradient: ${keyboardGradient};
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
        transform-origin: top left;
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
        background: var(--bezel-color);
        border-radius: 8px 8px 3px 3px;
        padding: 6px;
        box-shadow: 0 18px 35px -8px var(--shadow-color);
        position: relative;
      }

      .laptop-frame::before {
        content: '';
        position: absolute;
        top: 3px;
        left: 50%;
        transform: translate(-50%, 0);
        width: 4px;
        height: 4px;
        background: var(--camera-color);
        border-radius: 50%;
      }

      .laptop-screen {
        width: 100%;
        height: 100%;
        background: var(--screen-background);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .laptop-base {
        width: 238px;
        height: 14px;
        background: linear-gradient(to bottom, var(--keyboard-color), var(--bezel-color));
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
        background: linear-gradient(to bottom, var(--keyboard-color), var(--keyboard-gradient));
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
        background: var(--bezel-color);
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
        background: var(--bezel-color);
        border-radius: 17px;
        padding: 3px 8px 3px 8px;
        box-shadow: 0 18px 35px -8px var(--shadow-color);
        position: relative;
      }

      .phone-frame::before {
        content: '';
        position: absolute;
        top: 5px;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 42px;
        height: 2px;
        background: var(--camera-color);
        border-radius: 1px;
      }

      .phone-screen {
        width: 100%;
        height: calc(100% - 14px);
        background: var(--screen-background);
        border-radius: 14px;
        overflow: hidden;
        margin-top: 7px;
        position: relative;
      }

      .phone-home-indicator {
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 28px;
        height: 3px;
        background: var(--keyboard-color);
        border-radius: 2px;
      }

      /* Tablet Styles */
      .tablet-mockup {
        position: relative;
      }

      .tablet-frame {
        width: 182px;
        height: 238px;
        background: var(--bezel-color);
        border-radius: 14px;
        padding: 8px;
        box-shadow: 0 18px 35px -8px var(--shadow-color);
        position: relative;
      }

      .tablet-frame::before {
        content: '';
        position: absolute;
        top: 4px;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 5px;
        height: 5px;
        background: var(--camera-color);
        border-radius: 50%;
      }

      .tablet-screen {
        width: 100%;
        height: 100%;
        background: var(--screen-background);
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

      .device-iframe {
        pointer-events: auto;
        border: none;
        transform-origin: top left;
      }

      /* Laptop iframe scaling */
      .laptop-screen .device-iframe {
        width: 1280px;
        height: 800px;
        transform: scale(0.165625);
      }

      /* Phone iframe scaling */
      .phone-screen .device-iframe {
        width: 375px;
        height: 812px;
        transform: scale(0.29333);
      }

      /* Tablet iframe scaling */
      .tablet-screen .device-iframe {
        width: 768px;
        height: 1024px;
        transform: scale(0.21615);
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
        object-fit: ${fit || "none"};
      }

      .has-fit-hover {
        object-fit: ${hoverFit || "none"};
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
customElements.define("device-mockup", DeviceMockup);
