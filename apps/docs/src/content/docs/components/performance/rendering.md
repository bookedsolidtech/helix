---
title: Render Performance In-Depth
description: Master render performance optimization in Lit components with comprehensive guidance on Core Web Vitals (FCP, LCP, CLS), reflows, repaints, requestAnimationFrame, Performance API measurement, and production-grade patterns for enterprise healthcare applications.
sidebar:
  order: 2
---

# Render Performance In-Depth

Render performance is the foundation of user experience. In healthcare applications where milliseconds matter, understanding and optimizing every aspect of the rendering pipeline is not optional—it's essential. This guide provides comprehensive coverage of render performance concepts, Core Web Vitals metrics, browser rendering behavior, and production-grade optimization techniques for Lit components in the hx-library.

## Why Render Performance Matters

Render performance directly impacts three critical business outcomes:

1. **User Experience** — Slow renders cause visible lag, layout shifts, and unresponsive interfaces that frustrate users
2. **Accessibility** — Render delays disproportionately impact users with disabilities who rely on assistive technologies
3. **Business Metrics** — Poor Core Web Vitals performance leads to 8-35% losses in conversions, rankings, and revenue

As of 2025, only 47% of websites meet Google's Core Web Vitals thresholds. In healthcare, where patient care workflows depend on fast, reliable interfaces, this standard is unacceptable. Every component in hx-library is built to exceed these thresholds.

## Core Web Vitals: The Performance Standard

Google's Core Web Vitals define the essential metrics for measuring real-world user experience. These metrics are used for search ranking, user retention analysis, and performance monitoring.

### The Three Core Metrics

| Metric                              | What It Measures                                | Target  | Impact                  |
| ----------------------------------- | ----------------------------------------------- | ------- | ----------------------- |
| **LCP** (Largest Contentful Paint)  | How quickly the largest visible element renders | ≤ 2.5s  | Perceived loading speed |
| **INP** (Interaction to Next Paint) | How quickly the UI responds to user input       | ≤ 200ms | Responsiveness          |
| **CLS** (Cumulative Layout Shift)   | How much unexpected layout shift occurs         | ≤ 0.1   | Visual stability        |

**Measurement standard:** All thresholds are measured at the 75th percentile of page loads, segmented across mobile and desktop devices.

### Largest Contentful Paint (LCP)

LCP measures the render time of the largest image, text block, or video visible in the viewport, relative to when the user first navigated to the page.

#### What Counts as LCP

- `<img>` elements
- `<image>` elements inside `<svg>`
- `<video>` elements with poster images
- Elements with CSS `background-image`
- Block-level text elements

#### LCP in Shadow DOM Components

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-hero')
export class HelixHero extends LitElement {
  @property({ type: String })
  imageSrc = '';

  @property({ type: String })
  heading = '';

  render() {
    return html`
      <div class="hero">
        <!-- LCP candidate: Large image -->
        <img src="${this.imageSrc}" alt="${this.heading}" loading="eager" fetchpriority="high" />
        <!-- LCP candidate: Large text block -->
        <h1 class="hero__heading">${this.heading}</h1>
      </div>
    `;
  }
}
```

#### Optimizing LCP in hx-library

**Strategy 1: Prioritize critical resources**

```html
<!-- In your app's <head> -->
<link rel="preload" as="image" href="/hero.jpg" fetchpriority="high" />

<!-- Use eager loading for above-the-fold images -->
<hx-hero image-src="/hero.jpg" heading="Welcome"></hx-hero>
```

**Strategy 2: Avoid render-blocking resources**

```typescript
// ❌ BAD: Large import blocks first render
import { expensiveLibrary } from 'expensive-library';

// ✅ GOOD: Lazy load non-critical dependencies
async connectedCallback() {
  super.connectedCallback();
  const { expensiveLibrary } = await import('expensive-library');
  this.initializeFeature(expensiveLibrary);
}
```

**Strategy 3: Use efficient image formats**

```html
<!-- Modern formats with fallbacks -->
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero" />
</picture>
```

### First Contentful Paint (FCP)

FCP measures the time from navigation start to when the browser renders the first piece of DOM content (text, images, canvas, or SVG). Target: **≤ 1.8 seconds**.

#### FCP vs LCP

- **FCP** — First pixel painted (any content)
- **LCP** — Largest meaningful content painted

Both matter. FCP signals to users that the page is loading. LCP signals that the page is usable.

#### Optimizing FCP in Web Components

```typescript
@customElement('hx-app-shell')
export class HelixAppShell extends LitElement {
  // ✅ GOOD: Minimal first render
  render() {
    return html`
      <header>
        <hx-logo></hx-logo>
        <nav><!-- Critical navigation only --></nav>
      </header>
      <main>
        <!-- Placeholder while content loads -->
        <hx-skeleton></hx-skeleton>
      </main>
    `;
  }

  async firstUpdated() {
    // Load heavy content after first paint
    const { loadMainContent } = await import('./main-content.js');
    this.content = await loadMainContent();
    this.requestUpdate();
  }
}
```

**Critical FCP optimizations:**

1. **Inline critical CSS** — Embed styles needed for above-the-fold content
2. **Defer non-critical JavaScript** — Use `<script defer>` or `<script type="module">`
3. **Minimize web component registration overhead** — Register only components needed for first render
4. **Use lightweight loaders** — Replace heavy components with skeleton screens until data loads

### Cumulative Layout Shift (CLS)

CLS measures unexpected layout shifts during the entire page lifecycle. Every time a visible element changes position between frames, it contributes to CLS.

#### How CLS Is Calculated

```
Layout Shift Score = Impact Fraction × Distance Fraction
```

- **Impact Fraction** — Percentage of viewport affected by the shift
- **Distance Fraction** — Distance the element moved as a percentage of viewport height

#### Common CLS Causes in Web Components

**Cause 1: Images without dimensions**

```typescript
// ❌ BAD: Image loads and shifts content below
render() {
  return html`
    <img src="${this.src}" alt="${this.alt}">
    <p>Content below shifts when image loads</p>
  `;
}

// ✅ GOOD: Reserve space with explicit dimensions
render() {
  return html`
    <img
      src="${this.src}"
      alt="${this.alt}"
      width="800"
      height="600"
      style="aspect-ratio: 4/3; width: 100%; height: auto;"
    >
    <p>Content below stays in place</p>
  `;
}
```

**Cause 2: Dynamic content injection**

```typescript
// ❌ BAD: Loading state has different height
render() {
  if (this.loading) {
    return html`<div>Loading...</div>`; // 1 line tall
  }
  return html`<div class="content">${this.data}</div>`; // 10 lines tall → CLS!
}

// ✅ GOOD: Reserve consistent height
render() {
  return html`
    <div class="content" style="min-height: 300px;">
      ${this.loading
        ? html`<hx-spinner></hx-spinner>`
        : html`<div>${this.data}</div>`}
    </div>
  `;
}
```

**Cause 3: Font loading shifts**

```css
/* ❌ BAD: Font loads and text reflows */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: auto; /* Causes FOIT (Flash of Invisible Text) */
}

/* ✅ GOOD: Use fallback font with similar metrics */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately */
  /* Use size-adjust to match metrics */
  size-adjust: 97%;
  ascent-override: 95%;
  descent-override: 22%;
}
```

**Cause 4: Ads, embeds, and iframes**

```typescript
// ✅ Reserve space for external content
render() {
  return html`
    <div class="ad-slot" style="min-height: 250px;">
      <slot name="advertisement"></slot>
    </div>
  `;
}
```

#### CLS Prevention in hx-library

Every hx-library component is designed to minimize layout shift:

```typescript
// From hx-card.ts
@customElement('hx-card')
export class HelixCard extends LitElement {
  // Slot detection prevents layout shift
  private _hasSlotContent: Record<string, boolean> = {
    image: false,
    heading: false,
    footer: false,
    actions: false,
  };

  private _handleSlotChange(slotName: string) {
    return (e: Event) => {
      const slot = e.target as HTMLSlotElement;
      this._hasSlotContent[slotName] = slot.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
  }

  render() {
    return html`
      <div part="card" class="card">
        <!-- Hidden attribute prevents layout shift when slot is empty -->
        <div part="image" ?hidden=${!this._hasSlotContent['image']}>
          <slot name="image" @slotchange=${this._handleSlotChange('image')}></slot>
        </div>
        <!-- Additional slots with shift prevention -->
      </div>
    `;
  }
}
```

### Interaction to Next Paint (INP)

INP replaced First Input Delay (FID) as a Core Web Vital in 2024. It measures the latency of all user interactions (clicks, taps, keyboard input) throughout the page lifecycle.

**How it works:**

1. User interacts (e.g., clicks a button)
2. Event handler runs
3. Browser paints the updated UI
4. INP = time from interaction to paint

**Target:** ≤ 200ms

#### Optimizing INP in Web Components

**Strategy 1: Avoid long-running event handlers**

```typescript
// ❌ BAD: Heavy computation blocks the main thread
private _handleClick(e: MouseEvent) {
  const result = this.heavyComputation(this.data); // 500ms of synchronous work
  this.result = result;
}

// ✅ GOOD: Break up work with scheduler.yield()
private async _handleClick(e: MouseEvent) {
  const chunks = this.chunkData(this.data, 100);
  let result = [];

  for (const chunk of chunks) {
    result = result.concat(this.processChunk(chunk));
    // Yield to browser for input/rendering
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  this.result = result;
}
```

**Strategy 2: Debounce expensive operations**

```typescript
import { debounce } from '@helixui/utils';

@customElement('hx-search')
export class HelixSearch extends LitElement {
  @property({ type: String })
  query = '';

  // Debounce search to avoid excessive updates
  private _debouncedSearch = debounce((query: string) => {
    this.performSearch(query);
  }, 300);

  private _handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.query = input.value; // Update immediately for responsiveness
    this._debouncedSearch(this.query); // Debounce expensive operation
  }

  render() {
    return html`
      <input type="text" .value=${this.query} @input=${this._handleInput} placeholder="Search..." />
    `;
  }
}
```

**Strategy 3: Use passive event listeners**

```typescript
connectedCallback() {
  super.connectedCallback();

  // ✅ Passive listeners don't block scrolling
  this.addEventListener('touchstart', this._handleTouch, { passive: true });
  this.addEventListener('wheel', this._handleWheel, { passive: true });
}
```

## The Browser Rendering Pipeline

Understanding the rendering pipeline is essential for performance optimization. Every frame follows this sequence:

```
JavaScript → Style → Layout → Paint → Composite
```

### Pipeline Stages

1. **JavaScript** — Event handlers, timers, Lit updates run
2. **Style** — Recalculate CSS for modified elements
3. **Layout** — Compute geometry (position, size) for each element
4. **Paint** — Fill in pixels (text, colors, images, shadows)
5. **Composite** — Assemble layers and send to GPU

**Target:** Complete all stages in ≤ 16.7ms (60 FPS)

### Layout (Reflow)

Layout calculates the position and size of every element. It's the most expensive stage because changes can cascade:

```
Change one element → Recalculate children → Recalculate siblings → Recalculate parents
```

#### Properties That Trigger Layout

- **Box model** — `width`, `height`, `padding`, `border`, `margin`
- **Positioning** — `top`, `left`, `bottom`, `right`, `position`
- **Display** — `display`, `float`, `clear`
- **Dimensions** — `min-width`, `max-width`, `min-height`, `max-height`
- **Text** — `font-size`, `font-weight`, `line-height`, `text-align`
- **Flex/Grid** — `flex`, `grid-template-columns`, `align-items`, etc.

#### Reading Layout Properties (Forced Synchronous Layout)

```typescript
// ❌ BAD: Reading layout forces immediate reflow
updated() {
  this.style.width = '100px'; // Schedule layout
  const height = this.offsetHeight; // Force immediate layout! (slow)
  console.log(height);
}

// ✅ GOOD: Batch reads and writes
updated() {
  // Read phase
  const oldHeight = this.offsetHeight;

  // Write phase
  this.style.width = '100px';

  // Next frame read
  requestAnimationFrame(() => {
    const newHeight = this.offsetHeight;
    console.log(`Height changed from ${oldHeight} to ${newHeight}`);
  });
}
```

#### Layout Thrashing

Layout thrashing occurs when you repeatedly interleave reads and writes within a single frame:

```typescript
// ❌ BAD: Layout thrashing (read-write-read-write)
const items = this.renderRoot.querySelectorAll('.item');
items.forEach((item) => {
  const height = item.offsetHeight; // Forces layout
  item.style.width = `${height}px`; // Invalidates layout
  // Next iteration forces layout again → N layouts for N items!
});

// ✅ GOOD: Batch all reads, then all writes
const items = this.renderRoot.querySelectorAll('.item');

// Read phase
const heights = Array.from(items).map((item) => item.offsetHeight);

// Write phase
items.forEach((item, i) => {
  item.style.width = `${heights[i]}px`;
});
// Only 2 layouts total: one before reads, one after writes
```

### Paint (Repaint)

Paint fills in pixels for visible elements. Changes to visual properties trigger repaint:

#### Properties That Trigger Paint (But Not Layout)

- **Colors** — `color`, `background-color`, `border-color`
- **Visibility** — `visibility`, `opacity`
- **Outlines** — `outline`, `outline-color`
- **Shadows** — `box-shadow`, `text-shadow`
- **Backgrounds** — `background-image`, `background-size`

Repaint is faster than layout but still expensive. Avoid changing paint-only properties on many elements per frame.

### Composite

Compositing combines layers and sends them to the GPU. This is the fastest stage.

#### Properties That Only Trigger Composite

- **Transforms** — `transform: translate()`, `scale()`, `rotate()`
- **Opacity** — `opacity` (when element is on its own layer)

These properties are GPU-accelerated and can run at 60 FPS even for complex animations.

#### Promoting Elements to Layers

```css
/* Force GPU layer for smooth animations */
.animated-element {
  will-change: transform, opacity;
  /* Or: transform: translateZ(0); */
}
```

**Warning:** Too many layers consume GPU memory. Use sparingly for actively animated elements only.

### Performance Cost Hierarchy

```
Layout (slowest)
  ↓
Paint
  ↓
Composite (fastest)
```

**Golden rule:** Animate `transform` and `opacity` only. Avoid animating layout or paint properties.

## Reflows and Repaints: Deep Dive

### What Triggers Reflows

Reflows (also called layouts) recalculate element geometry. They are triggered by:

1. **DOM changes** — Adding/removing elements
2. **Content changes** — Text updates, image loads
3. **Style changes** — Modifying layout-affecting CSS
4. **Reading layout properties** — `offsetHeight`, `getBoundingClientRect()`, etc.
5. **Window resize** — Viewport dimension changes
6. **Font loading** — New font applied to text

### Minimizing Reflows in Lit Components

**Technique 1: Batch DOM updates**

```typescript
// ❌ BAD: Multiple reflows (one per property change)
updated() {
  this.style.width = '200px';    // Reflow 1
  this.style.height = '100px';   // Reflow 2
  this.style.padding = '20px';   // Reflow 3
}

// ✅ GOOD: Single reflow via cssText
updated() {
  this.style.cssText = 'width: 200px; height: 100px; padding: 20px;';
  // Reflow happens once when browser is ready
}
```

**Technique 2: Use CSS classes instead of inline styles**

```typescript
// ❌ BAD: Inline styles cause layout
private _handleExpand() {
  this.style.height = 'auto';
  this.style.overflow = 'visible';
  this.style.opacity = '1';
}

// ✅ GOOD: Toggle class, let CSS handle it
private _handleExpand() {
  this.classList.add('expanded');
}
```

```css
.expanded {
  height: auto;
  overflow: visible;
  opacity: 1;
  /* Browser batches all changes together */
}
```

**Technique 3: Detach from DOM during heavy updates**

```typescript
private _rebuildTree(data: TreeNode[]) {
  const tree = this.renderRoot.querySelector('.tree');
  if (!tree) return;

  // Detach from DOM
  const parent = tree.parentElement;
  parent?.removeChild(tree);

  // Make multiple updates (no reflows while detached)
  this.buildTreeNodes(tree, data);

  // Reattach (single reflow)
  parent?.appendChild(tree);
}
```

**Technique 4: Avoid layout reads in `updated()`**

```typescript
// ❌ BAD: Forces synchronous layout
updated() {
  const button = this.renderRoot.querySelector('button');
  const width = button?.offsetWidth; // Forced reflow!
  this.buttonWidth = width;
}

// ✅ GOOD: Defer layout reads to next frame
updated() {
  requestAnimationFrame(() => {
    const button = this.renderRoot.querySelector('button');
    this.buttonWidth = button?.offsetWidth;
  });
}
```

### The Comprehensive Reflow Property List

Reading these properties forces immediate layout calculation:

**Element dimensions:**

- `offsetWidth`, `offsetHeight`, `offsetTop`, `offsetLeft`, `offsetParent`
- `clientWidth`, `clientHeight`, `clientTop`, `clientLeft`
- `scrollWidth`, `scrollHeight`, `scrollTop`, `scrollLeft`

**Computed styles:**

- `getComputedStyle()`
- `getBoundingClientRect()`
- `getClientRects()`

**Window dimensions:**

- `window.innerWidth`, `window.innerHeight`
- `window.scrollX`, `window.scrollY`
- `window.getMatchedCSSRules()`

**Document dimensions:**

- `document.documentElement.scrollHeight`
- `document.body.scrollHeight`

**Focus:**

- `element.focus()`

**Measurement APIs:**

- `Range.getBoundingClientRect()`
- `SVGElement.getBBox()`

For the comprehensive list, see [Paul Irish's gist on layout-triggering properties](https://gist.github.com/paulirish/5d52fb081b3570c81e3a).

## requestAnimationFrame: The Performance Tool

`requestAnimationFrame` (rAF) tells the browser you want to perform an animation and schedules your callback before the next repaint.

### Why Use requestAnimationFrame

1. **Perfect timing** — Runs at the start of each frame (before paint)
2. **60 FPS** — Browser optimizes for 16.7ms per frame
3. **Automatic pausing** — Stops when tab is hidden (saves CPU/battery)
4. **Smooth animations** — Synchronized with display refresh rate

### Basic Usage

```typescript
@customElement('hx-animated-counter')
export class HelixAnimatedCounter extends LitElement {
  @property({ type: Number })
  target = 100;

  @state()
  private _current = 0;

  private _animationId?: number;

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('target')) {
      this._animateToTarget();
    }
  }

  private _animateToTarget() {
    const start = this._current;
    const end = this.target;
    const duration = 1000; // 1 second
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      this._current = start + (end - start) * easeOut;

      if (progress < 1) {
        this._animationId = requestAnimationFrame(animate);
      }
    };

    this._animationId = requestAnimationFrame(animate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
    }
  }

  render() {
    return html`<div class="counter">${Math.round(this._current)}</div>`;
  }
}
```

### Optimizing Animations with rAF

**Pattern 1: Throttle expensive operations**

```typescript
private _lastFrameTime = 0;
private _frameInterval = 1000 / 30; // 30 FPS (less expensive than 60)

private _animate = (currentTime: number) => {
  const elapsed = currentTime - this._lastFrameTime;

  if (elapsed > this._frameInterval) {
    this._lastFrameTime = currentTime - (elapsed % this._frameInterval);

    // Expensive operation runs at 30 FPS
    this.updateExpensiveVisualization();
  }

  this._animationId = requestAnimationFrame(this._animate);
};
```

**Pattern 2: Read-then-write pattern**

```typescript
private _animate = () => {
  // Read phase (all reads together)
  const scrollTop = window.scrollY;
  const viewportHeight = window.innerHeight;

  // Write phase (all writes together)
  this.style.transform = `translateY(${scrollTop * 0.5}px)`;
  this.style.opacity = `${1 - (scrollTop / viewportHeight)}`;

  this._animationId = requestAnimationFrame(this._animate);
};
```

**Pattern 3: Cancel on component removal**

```typescript
connectedCallback() {
  super.connectedCallback();
  this._animationId = requestAnimationFrame(this._animate);
}

disconnectedCallback() {
  super.disconnectedCallback();
  if (this._animationId) {
    cancelAnimationFrame(this._animationId);
    this._animationId = undefined;
  }
}
```

### Long Animation Frames (LoAF)

The Long Animation Frames API helps identify performance bottlenecks in animations. A long animation frame is any frame that takes > 50ms (blocking smooth 60 FPS rendering).

```typescript
// Monitor long animation frames
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // entry is a PerformanceLongAnimationFrameTiming
    console.warn('Long frame detected:', {
      duration: entry.duration,
      blockingDuration: entry.blockingDuration,
      renderStart: entry.renderStart,
      scripts: entry.scripts,
    });
  }
});

observer.observe({ type: 'long-animation-frame', buffered: true });
```

Use LoAF data to identify which scripts or operations are causing jank, then optimize them.

## Performance API: Measuring Render Performance

The Performance API provides high-resolution timing data for measuring render performance in production.

### Performance.now()

Returns a high-resolution timestamp (accurate to 5 microseconds).

```typescript
@customElement('hx-data-table')
export class HelixDataTable extends LitElement {
  @property({ type: Array })
  data: TableRow[] = [];

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('data')) {
      this._measureRenderTime();
    }
  }

  private _measureRenderTime() {
    const start = performance.now();

    this.requestUpdate().then(() => {
      const end = performance.now();
      const duration = end - start;

      console.log(`Render time: ${duration.toFixed(2)}ms`);

      // Send to analytics
      if (duration > 100) {
        console.warn(`Slow render detected: ${duration.toFixed(2)}ms`);
      }
    });
  }

  render() {
    return html`
      <table>
        ${this.data.map(
          (row) =>
            html`<tr>
              <!-- ... -->
            </tr>`,
        )}
      </table>
    `;
  }
}
```

### Performance Marks and Measures

Use marks to identify specific points in time, and measures to calculate durations between marks.

```typescript
@customElement('hx-async-loader')
export class HelixAsyncLoader extends LitElement {
  async connectedCallback() {
    super.connectedCallback();

    performance.mark('hx-loader-start');

    await this._loadData();
    performance.mark('hx-loader-data-loaded');

    await this.updateComplete;
    performance.mark('hx-loader-rendered');

    // Create measures
    performance.measure('hx-loader-fetch', 'hx-loader-start', 'hx-loader-data-loaded');
    performance.measure('hx-loader-render', 'hx-loader-data-loaded', 'hx-loader-rendered');
    performance.measure('hx-loader-total', 'hx-loader-start', 'hx-loader-rendered');

    // Retrieve measures
    const fetchDuration = performance.getEntriesByName('hx-loader-fetch')[0].duration;
    const renderDuration = performance.getEntriesByName('hx-loader-render')[0].duration;
    const totalDuration = performance.getEntriesByName('hx-loader-total')[0].duration;

    console.log({
      fetch: `${fetchDuration.toFixed(2)}ms`,
      render: `${renderDuration.toFixed(2)}ms`,
      total: `${totalDuration.toFixed(2)}ms`,
    });

    // Clean up
    performance.clearMarks();
    performance.clearMeasures();
  }

  private async _loadData() {
    const response = await fetch('/api/data');
    this.data = await response.json();
  }

  render() {
    return html`<div>${this.data}</div>`;
  }
}
```

### PerformanceObserver

Monitor performance entries as they occur, without polling.

```typescript
@customElement('hx-performance-monitor')
export class HelixPerformanceMonitor extends LitElement {
  private _observer?: PerformanceObserver;

  connectedCallback() {
    super.connectedCallback();

    // Observe paint timing
    this._observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);

        if (entry.name === 'first-contentful-paint') {
          this._trackFCP(entry.startTime);
        }
      }
    });

    this._observer.observe({ type: 'paint', buffered: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  private _trackFCP(time: number) {
    // Send to analytics
    console.log(`FCP: ${time.toFixed(2)}ms`);
  }

  render() {
    return html`<slot></slot>`;
  }
}
```

### User Timing API Example: Profiling Expensive Operations

```typescript
@customElement('hx-chart')
export class HelixChart extends LitElement {
  @property({ type: Array })
  data: ChartPoint[] = [];

  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('data')) {
      performance.mark('chart-process-start');

      this._processedData = this._processChartData(this.data);

      performance.mark('chart-process-end');
      performance.measure('chart-process', 'chart-process-start', 'chart-process-end');

      const measure = performance.getEntriesByName('chart-process')[0];
      console.log(`Data processing took ${measure.duration.toFixed(2)}ms`);
    }
  }

  private _processChartData(data: ChartPoint[]): ProcessedData {
    // Expensive computation
    return data.map(/* transform */);
  }

  render() {
    return html`<canvas></canvas>`;
  }
}
```

## Lit's Update Cycle Optimization

Lit's reactive update cycle is designed for performance, but understanding its internals helps you avoid pitfalls.

### Update Batching

Lit automatically batches multiple property changes into a single update:

```typescript
@customElement('hx-form')
export class HelixForm extends LitElement {
  @property({ type: String }) firstName = '';
  @property({ type: String }) lastName = '';
  @property({ type: String }) email = '';

  updateForm(data: FormData) {
    // All three changes batched into one update
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;

    // render() called ONCE with all changes
  }

  render() {
    console.log('Rendering'); // Logs once
    return html`
      <div>
        <input .value=${this.firstName} />
        <input .value=${this.lastName} />
        <input .value=${this.email} />
      </div>
    `;
  }
}
```

### Avoiding Unnecessary Renders

**Technique 1: Use `@state` for internal values**

```typescript
// ❌ BAD: Public property causes unnecessary attribute updates
@property({ type: Number })
private _internalCounter = 0;

// ✅ GOOD: @state skips attribute serialization
@state()
private _internalCounter = 0;
```

**Technique 2: Custom `hasChanged` for complex values**

```typescript
import { isEqual } from 'lodash-es';

@customElement('hx-data-view')
export class HelixDataView extends LitElement {
  @property({
    hasChanged(newVal: unknown[], oldVal: unknown[]) {
      // Deep equality check (avoid re-render if data is equivalent)
      return !isEqual(newVal, oldVal);
    },
  })
  data: unknown[] = [];

  render() {
    return html`<div>${JSON.stringify(this.data)}</div>`;
  }
}
```

**Technique 3: `shouldUpdate` for conditional rendering**

```typescript
@customElement('hx-expensive-chart')
export class HelixExpensiveChart extends LitElement {
  @property({ type: Array }) data: number[] = [];
  @property({ type: Boolean }) visible = true;

  shouldUpdate(changedProperties: PropertyValues<this>): boolean {
    // Don't render if hidden
    if (!this.visible && !changedProperties.has('visible')) {
      return false;
    }

    return true;
  }

  render() {
    return html`<canvas></canvas>`; // Expensive rendering
  }
}
```

### The `guard()` Directive

Use `guard()` to prevent re-rendering expensive template sections:

```typescript
import { guard } from 'lit/directives/guard.js';

@customElement('hx-product-list')
export class HelixProductList extends LitElement {
  @property({ type: Array }) products: Product[] = [];
  @property({ type: String }) sortOrder = 'asc';

  render() {
    return html`
      ${guard([this.products], () =>
        this.products.map(
          (product) => html` <hx-product-card .product=${product}></hx-product-card> `,
        ),
      )}
    `;
  }
}
```

`guard()` only re-renders when `this.products` identity changes, not when `sortOrder` changes.

### The `repeat()` Directive with Keys

Use `repeat()` with keys for efficient list rendering:

```typescript
import { repeat } from 'lit/directives/repeat.js';

@customElement('hx-task-list')
export class HelixTaskList extends LitElement {
  @property({ type: Array }) tasks: Task[] = [];

  render() {
    return html`
      <ul>
        ${repeat(
          this.tasks,
          (task) => task.id, // Key function (efficient DOM reuse)
          (task) => html`
            <li>
              <hx-task-item .task=${task}></hx-task-item>
            </li>
          `,
        )}
      </ul>
    `;
  }
}
```

**Why keys matter:**

- Without keys, Lit diffs by index (inefficient when items move/reorder)
- With keys, Lit tracks individual items (reuses DOM nodes correctly)

## Performance Profiling

### Chrome DevTools Performance Panel

1. Open DevTools → Performance tab
2. Click Record
3. Interact with your component
4. Click Stop
5. Analyze the flame chart:
   - Yellow = JavaScript execution
   - Purple = Layout/reflow
   - Green = Paint
   - Light green = Composite

### Identifying Bottlenecks

**Long yellow bars** → JavaScript is blocking the main thread

- Break up long tasks with `setTimeout` or `scheduler.yield()`
- Defer non-critical work to `requestIdleCallback`

**Purple spikes** → Excessive layout/reflows

- Batch DOM reads and writes
- Avoid reading layout properties in loops

**Green blocks** → Paint is expensive

- Reduce painted area (use `will-change`, layers)
- Simplify visual complexity (shadows, gradients)

### Lighthouse CI

Run Lighthouse in CI to catch performance regressions:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            http://localhost:3000
          budgetPath: ./lighthouse-budget.json
```

**lighthouse-budget.json:**

```json
{
  "timings": [
    {
      "metric": "first-contentful-paint",
      "budget": 1800
    },
    {
      "metric": "largest-contentful-paint",
      "budget": 2500
    },
    {
      "metric": "cumulative-layout-shift",
      "budget": 0.1
    },
    {
      "metric": "max-potential-fid",
      "budget": 130
    }
  ]
}
```

## hx-library Optimizations

Every component in hx-library follows these performance patterns:

### 1. Minimal Shadow DOM Depth

```typescript
// ✅ Flat structure (fast)
render() {
  return html`
    <button part="button" class="button">
      <slot></slot>
    </button>
  `;
}

// ❌ Nested structure (slower)
render() {
  return html`
    <div>
      <div>
        <div>
          <button part="button">
            <slot></slot>
          </button>
        </div>
      </div>
    </div>
  `;
}
```

### 2. Avoid `querySelector` in `render()`

```typescript
// ❌ BAD: querySelector during every render
render() {
  const button = this.renderRoot.querySelector('button');
  button?.classList.add('active');
  return html`<button>Click</button>`;
}

// ✅ GOOD: Use @query decorator
@query('button')
private _button!: HTMLButtonElement;

firstUpdated() {
  this._button.classList.add('active');
}

render() {
  return html`<button>Click</button>`;
}
```

### 3. Defer Expensive Initialization

```typescript
@customElement('hx-data-grid')
export class HelixDataGrid extends LitElement {
  @property({ type: Array }) data: GridRow[] = [];

  async firstUpdated() {
    // Load heavy dependencies only when component is used
    const { GridVirtualizer } = await import('./grid-virtualizer.js');
    this._virtualizer = new GridVirtualizer(this.data);
    this.requestUpdate();
  }

  render() {
    if (!this._virtualizer) {
      return html`<hx-spinner></hx-spinner>`;
    }

    return html`<div>${this._virtualizer.render()}</div>`;
  }
}
```

### 4. Lazy Registration with Intersection Observer

```typescript
// Only register heavy component when it's about to enter viewport
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        import('./hx-heavy-component.js').then(() => {
          observer.unobserve(entry.target);
        });
      }
    });
  },
  { rootMargin: '50px' },
);

// Observe placeholder
const placeholder = document.querySelector('[data-lazy="hx-heavy-component"]');
if (placeholder) {
  observer.observe(placeholder);
}
```

## Best Practices Summary

### Rendering

1. **Keep `render()` pure** — No side effects, no state mutations
2. **Avoid DOM queries in `render()`** — Use `@query` decorator instead
3. **Use `@state` for internal values** — Skips attribute reflection overhead
4. **Leverage `guard()` for expensive sections** — Only re-render when dependencies change
5. **Use `repeat()` with keys for lists** — Enables efficient DOM reuse

### Layout and Paint

6. **Batch DOM reads and writes** — Read all, then write all
7. **Avoid layout thrashing** — Don't interleave reads and writes in loops
8. **Animate `transform` and `opacity` only** — GPU-accelerated, no layout/paint
9. **Use `will-change` sparingly** — Only for actively animated elements
10. **Reserve space for dynamic content** — Prevent CLS with explicit dimensions

### Event Handling

11. **Debounce expensive operations** — Reduce update frequency for heavy handlers
12. **Use passive listeners** — Don't block scrolling
13. **Break up long tasks** — Use `setTimeout` or `scheduler.yield()`
14. **Avoid synchronous XHR** — Always use async fetch

### Measurement

15. **Use Performance API** — Mark and measure critical operations
16. **Monitor Core Web Vitals** — Track LCP, INP, CLS in production
17. **Profile with DevTools** — Identify bottlenecks before shipping
18. **Set performance budgets** — Enforce thresholds in CI

### hx-library Specific

19. **Per-component bundles < 5KB (min+gz)** — Enforced in CI
20. **Full library bundle < 50KB (min+gz)** — Enables fast CDN delivery
21. **Zero production dependencies beyond Lit** — Minimal runtime overhead
22. **Tree-shakeable exports** — Only pay for what you use

## Performance Budget Enforcement

hx-library enforces strict performance budgets in CI:

| Metric                        | Budget  | Tool                      |
| ----------------------------- | ------- | ------------------------- |
| Individual component (min+gz) | < 5 KB  | bundlephobia / size-limit |
| Full library bundle (min+gz)  | < 50 KB | Vite build analysis       |
| Time to first render (CDN)    | < 100ms | Performance test          |
| LCP (docs site)               | < 2.5s  | Lighthouse CI             |
| INP                           | < 200ms | Lighthouse CI             |
| CLS                           | < 0.1   | Lighthouse CI             |

**Any violation blocks the release.** Fix forward, never skip.

## Real-World Example: Optimizing hx-select

The `hx-select` component demonstrates production-grade render performance:

```typescript
// From packages/hx-library/src/components/hx-select/hx-select.ts
@customElement('hx-select')
export class HelixSelect extends LitElement {
  @property({ type: String, reflect: true })
  value = '';

  @query('.field__select')
  private _select!: HTMLSelectElement;

  // ✅ Use @state for internal tracking (no attribute overhead)
  @state() private _hasLabelSlot = false;
  @state() private _hasErrorSlot = false;

  // ✅ Batch option syncing (single DOM update)
  private _syncOptions(): void {
    if (!this._select) return;

    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const slottedOptions = slot
      .assignedElements({ flatten: true })
      .filter((el): el is HTMLOptionElement => el instanceof HTMLOptionElement);

    // Remove old options (batched)
    const existingCloned = this._select.querySelectorAll('option[data-cloned]');
    existingCloned.forEach((opt) => opt.remove());

    // Clone new options (batched)
    slottedOptions.forEach((option) => {
      const clone = option.cloneNode(true) as HTMLOptionElement;
      clone.setAttribute('data-cloned', '');
      this._select.appendChild(clone);
    });

    // Single value sync at the end
    if (this.value) {
      this._select.value = this.value;
    }
  }

  // ✅ Only update validity when value changes
  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();

      // Defer native select sync to avoid forced layout
      if (this._select && this._select.value !== this.value) {
        this._select.value = this.value;
      }
    }
  }

  render() {
    // ✅ Compute classes once
    const hasError = !!this.error;
    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Minimal, flat DOM structure -->
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label ? html`<label part="label">${this.label}</label>` : nothing}
        </slot>
        <div part="select-wrapper">
          <select part="select" @change=${this._handleChange}>
            <!-- Options populated via _syncOptions() -->
          </select>
        </div>
        <slot @slotchange=${this._handleSlotChange} style="display: none;"></slot>
        ${hasError ? html`<div part="error">${this.error}</div>` : nothing}
      </div>
    `;
  }
}
```

**Performance wins:**

- `@state` for internal tracking (no attribute overhead)
- Batched option cloning (single DOM update)
- Conditional validity updates (only when value changes)
- Flat DOM structure (minimal layout depth)
- Computed classes cached (no redundant classMap calls)

## Conclusion

Render performance is non-negotiable for enterprise healthcare applications. By mastering Core Web Vitals, understanding the browser rendering pipeline, avoiding layout thrashing, using `requestAnimationFrame` effectively, and measuring with the Performance API, you can build components that deliver exceptional user experiences.

Every component in hx-library is designed to exceed performance thresholds. Follow these patterns, enforce performance budgets, and ship fast, reliable interfaces that users trust.

## References

- [Largest Contentful Paint (LCP) | Articles | web.dev](https://web.dev/articles/lcp)
- [First Contentful Paint (FCP) | Articles | web.dev](https://web.dev/articles/fcp)
- [Web Vitals | Articles | web.dev](https://web.dev/articles/vitals)
- [Optimize Largest Contentful Paint | Articles | web.dev](https://web.dev/articles/optimize-lcp)
- [Avoid large, complex layouts and layout thrashing | Articles | web.dev](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [Window: requestAnimationFrame() method - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [Long Animation Frames API | Web Platform | Chrome for Developers](https://developer.chrome.com/docs/web-platform/long-animation-frames)
- [What forces layout/reflow - Paul Irish's comprehensive list](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- [Reflow vs Repaint: What Every Developer Should Know | Frontend Master](https://rahuulmiishra.medium.com/reflow-vs-repaint-what-every-developer-should-know-226f073c9ad8)
- [Performance Optimization — Understanding Reflow, Repaint, and Compositing | Jude Wei](https://medium.com/@weijunext/performance-optimization-thoroughly-understanding-and-deconstructing-reflow-repaint-and-d5d9118f2cdf)
