# Device Mockup Web Component

A customizable web component that renders realistic device mockups (laptop or phone) with support for images, videos, and multiple fallback formats.

## Features

- Single component supports both laptop and phone devices
- Auto-detects media type (image vs video) from file extension
- Multiple fallback format support (AVIF, WebP, PNG, MP4, WebM, etc.)
- Automatic theme detection (light/dark) or manual override
- Hover state support with fallbacks
- Responsive sizing via CSS
- No default animations - add your own with CSS
- Fully accessible with ARIA support

## Installation

```html
<script
  src="https://cdn.jsdelivr.net/gh/DevManSam777/device-mockup@main/device-mockup.js"
  defer
></script>
```

## Usage

```html
<!-- Laptop with image -->
<device-mockup
  type="laptop"
  src="screenshot.avif"
  fallback="screenshot.webp"
  fallback-2="screenshot.png"
  alt="Dashboard analytics view"
>
</device-mockup>

<!-- Phone with video -->
<device-mockup
  type="phone"
  src="demo.webm"
  fallback="demo.mp4"
  fallback-2="poster.png"
  hover-src="demo-hover.webm"
  alt="Mobile app demo"
  theme="dark"
>
</device-mockup>
```

## Attributes

- `type` - Device type: `"laptop"`, `"phone"`, or `"tablet"` (required)
- `src` - Primary media source (required)
- `fallback` - First fallback source (optional)
- `fallback-2` - Second fallback source (optional)
- `hover-src` - Media to show on hover (optional)
- `hover-fallback` - First hover fallback (optional)
- `hover-fallback-2` - Second hover fallback (optional)
- `alt` - Alt text for accessibility (required)
- `theme` - Theme override: `"light"`, `"dark"`, or `"auto"` (default: `"auto"`)
- `padding` - CSS padding value for the main media (e.g., `"3px"`, `"0.5rem"`) (optional, default: `"0"`)
- `hover-padding` - CSS padding value for hover media (optional, defaults to `padding` value)
- `fit` - Object-fit value for main media: `"cover"`, `"contain"`, `"fill"`, `"none"`, or `"scale-down"` (optional, default: no object-fit)
- `hover-fit` - Object-fit value for hover media (optional, default: no object-fit)

## Recommended Media Dimensions

For best results, use media with these aspect ratios:

**Laptop:**

- Aspect ratio: **16:9** (landscape)
- Recommended dimensions: 1920x1080, 1600x900, 1280x720, or 800x450

**Phone:**

- Aspect ratio: **9:16** (portrait)
- Recommended dimensions: 1080x1920, 720x1280, 1170x2532, or 450x800

**Tablet:**

- Aspect ratio: **4:3** (portrait)
- Recommended dimensions: 2048x2732, 1536x2048, 1024x1366, or 768x1024

Using the correct aspect ratio ensures media displays properly without distortion. If your media has a different aspect ratio, use the `fit` and `padding` attributes to control how it's displayed.

## Fine-tuning Image Fit

### Using Padding

If your images don't match the exact aspect ratios or you want an inset border effect, use the `padding` attribute:

```html
<!-- Add padding to create an inset border effect -->
<device-mockup
  type="laptop"
  src="screenshot.png"
  padding="3px"
  alt="Dashboard with border"
>
</device-mockup>

<!-- Different padding for main and hover images -->
<device-mockup
  type="phone"
  src="screen1.png"
  padding="4px"
  hover-src="screen2.png"
  hover-padding="2px"
  alt="App screens"
>
</device-mockup>
```

### Using Object-fit

For media with different aspect ratios, use the `fit` attribute to control how the content fills the device screen:

```html
<!-- Use cover to fill the screen (may crop edges) -->
<device-mockup type="laptop" src="video.mp4" fit="cover" alt="Video demo">
</device-mockup>

<!-- Use contain to show full content (may have letterboxing) -->
<device-mockup
  type="phone"
  src="screenshot.png"
  fit="contain"
  alt="Full screenshot"
>
</device-mockup>

<!-- Different fit for main and hover images -->
<device-mockup
  type="laptop"
  src="screenshot.png"
  fit="contain"
  hover-src="video.mp4"
  hover-fit="cover"
  alt="Mixed media demo"
>
</device-mockup>
```

**fit values:**

- `cover` - Fills the screen, may crop content to maintain aspect ratio
- `contain` - Shows full content, may add letterboxing
- `fill` - Stretches to fill (may distort)
- `none` - Uses natural size (default)
- `scale-down` - Uses smaller of `none` or `contain`

## Sizing

Control size with CSS:

```css
device-mockup {
  width: 600px; /* Component scales proportionally */
}

/* Or use CSS custom properties */
device-mockup {
  --device-scale: 1.5;
}
```

## Custom Animations

The component has no default animations. Add your own with CSS:

```css
device-mockup {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

## Custom Colors

Override the default device colors using CSS custom properties:

```css
device-mockup {
  --frame-color: #3b82f6; /* Device frame/bezel color */
  --frame-dark: #1e40af; /* Darker frame accents */
  --base-color: #60a5fa; /* Laptop base/phone indicator */
  --base-dark: #2563eb; /* Darker base accents */
  --shadow-color: rgba(59, 130, 246, 0.3); /* Drop shadow */
}
```

**Available custom properties:**

- `--frame-color` - Main device frame/bezel color
- `--frame-dark` - Darker frame accents (notches, camera)
- `--screen-bg` - Screen background (not typically visible)
- `--base-color` - Laptop base and phone home indicator
- `--base-dark` - Darker accents for base details
- `--shadow-color` - Drop shadow color and opacity
- `--device-scale` - Scale transform (default: 1)

**Example - Blue device:**

```css
device-mockup {
  --frame-color: #3b82f6;
  --frame-dark: #1e40af;
  --base-color: #60a5fa;
  --shadow-color: rgba(59, 130, 246, 0.4);
}
```
---
## [MIT License](License)

 &copy;2025 DevManSam
