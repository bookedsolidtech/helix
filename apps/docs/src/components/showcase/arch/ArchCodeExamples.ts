/**
 * Code example string constants for the System Architecture page.
 *
 * Extracted from the frontmatter of system-architecture.astro to enable
 * sharing across decomposed tab components. These are pre-formatted HTML
 * strings with syntax-highlighting spans, rendered via Astro's set:html.
 */

// ─── Tab 1: Slots vs Props ───────────────────────────────────────────────────

export const codePropsTemplate = `<span class="cmt">{# Component controls ALL rendering #}</span>
&lt;<span class="tag">wc-card</span>
  <span class="prop-hl">title</span>=<span class="val">"{{ content.field_title }}"</span>
  <span class="prop-hl">description</span>=<span class="val">"{{ content.field_body }}"</span>
  <span class="prop-hl">image-src</span>=<span class="val">"{{ file_url(content.field_image) }}"</span>
  <span class="prop-hl">image-alt</span>=<span class="val">"{{ content.field_image.alt }}"</span>
  <span class="prop-hl">wc-href</span>=<span class="val">"{{ url }}"</span>
  <span class="prop-hl">variant</span>=<span class="val">"elevated"</span>
&gt;&lt;/<span class="tag">wc-card</span>&gt;`;

export const codePropsStorybook = `<span class="cmt">// Perfect in Storybook - all props visible</span>
<span class="kw">export const</span> <span class="var">Default</span> = {
  args: {
    <span class="prop-hl">title</span>: <span class="str">'Article Title'</span>,
    <span class="prop-hl">description</span>: <span class="str">'Summary text...'</span>,
    <span class="prop-hl">imageSrc</span>: <span class="str">'/placeholder.jpg'</span>,
    <span class="prop-hl">variant</span>: <span class="str">'elevated'</span>,
  },
};`;

export const codeSlotsTemplate = `<span class="cmt">{# Drupal controls ALL content #}</span>
&lt;<span class="tag">wc-card</span> <span class="attr">variant</span>=<span class="val">"elevated"</span>&gt;
  &lt;<span class="tag">img</span> <span class="slot-hl">slot</span>=<span class="val">"media"</span>
    <span class="attr">src</span>=<span class="val">"{{ file_url(content.field_image) }}"</span>
    <span class="attr">alt</span>=<span class="val">"{{ content.field_image.alt }}"</span> /&gt;
  &lt;<span class="tag">h3</span> <span class="slot-hl">slot</span>=<span class="val">"heading"</span>&gt;
    {{ content.field_title }}
  &lt;/<span class="tag">h3</span>&gt;
  &lt;<span class="tag">div</span> <span class="slot-hl">slot</span>=<span class="val">"body"</span>&gt;
    {{ content.field_body }}
  &lt;/<span class="tag">div</span>&gt;
  &lt;<span class="tag">a</span> <span class="slot-hl">slot</span>=<span class="val">"actions"</span> <span class="attr">href</span>=<span class="val">"{{ url }}"</span>&gt;
    Read More
  &lt;/<span class="tag">a</span>&gt;
&lt;/<span class="tag">wc-card</span>&gt;`;

export const codeSlotsStorybook = `<span class="cmt">// Slots need HTML strings in Storybook</span>
<span class="kw">export const</span> <span class="var">Default</span> = {
  args: {
    <span class="attr">variant</span>: <span class="str">'elevated'</span>,
  },
  render: <span class="fn">(args)</span> <span class="kw">=&gt;</span> <span class="str">\`
    &lt;wc-card variant="\${</span><span class="var">args.variant</span><span class="str">}"&gt;
      &lt;img </span><span class="slot-hl">slot="media"</span><span class="str"> ... /&gt;
      &lt;h3 </span><span class="slot-hl">slot="heading"</span><span class="str">&gt;...&lt;/h3&gt;
      &lt;div </span><span class="slot-hl">slot="body"</span><span class="str">&gt;...&lt;/div&gt;
    &lt;/wc-card&gt;\`</span>,
};`;

// ─── Tab 2: Component Loading ────────────────────────────────────────────────

export const codeExampleCard = `&lt;<span class="tag">wc-card</span> <span class="attr">variant</span>=<span class="val">"elevated"</span> <span class="attr">interactive</span>&gt;
  &lt;<span class="tag">img</span> <span class="slot-hl">slot="media"</span>
    <span class="attr">src</span>=<span class="val">"{{ file_url(image.uri) }}"</span>
    <span class="attr">alt</span>=<span class="val">"{{ image.alt }}"</span>
    <span class="attr">loading</span>=<span class="val">"lazy"</span> /&gt;

  &lt;<span class="tag">h3</span> <span class="slot-hl">slot="heading"</span>&gt;
    {{ title }}
  &lt;/<span class="tag">h3</span>&gt;

  &lt;<span class="tag">p</span> <span class="slot-hl">slot="body"</span>&gt;
    {{ body|striptags|truncate(120) }}
  &lt;/<span class="tag">p</span>&gt;

  &lt;<span class="tag">a</span> <span class="slot-hl">slot="actions"</span> <span class="attr">href</span>=<span class="val">"{{ url }}"</span>&gt;
    Read More &amp;rarr;
  &lt;/<span class="tag">a</span>&gt;
&lt;/<span class="tag">wc-card</span>&gt;`;

export const codeExampleButton = `&lt;<span class="tag">wc-button</span>
  <span class="prop-hl">variant</span>=<span class="val">"primary"</span>
  <span class="prop-hl">size</span>=<span class="val">"large"</span>
  <span class="prop-hl">icon</span>=<span class="val">"arrow-right"</span>
  <span class="prop-hl">icon-position</span>=<span class="val">"end"</span>
  {% <span class="kw">if</span> is_disabled %}
    <span class="prop-hl">disabled</span>
  {% <span class="kw">endif</span> %}
&gt;
  {{ button_label }}
&lt;/<span class="tag">wc-button</span>&gt;

<span class="cmt">{# Loading state example #}</span>
&lt;<span class="tag">wc-button</span>
  <span class="prop-hl">variant</span>=<span class="val">"primary"</span>
  <span class="prop-hl">loading</span>
  <span class="prop-hl">aria-busy</span>=<span class="val">"true"</span>
&gt;
  Submitting...
&lt;/<span class="tag">wc-button</span>&gt;`;

export const codeLoadingSingleBundle = `<span class="cmt"># Single bundle - every component in one file</span>
<span class="var">wc_2026</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/wc-2026.bundle.js</span>: <span class="val">{ minified: true }</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">core/drupal</span>
    - <span class="attr">core/once</span>`;

export const codeLoadingPerComponent = `<span class="cmt"># Per-component - surgical loading</span>
<span class="var">wc_2026/card</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/components/wc-card.js</span>: <span class="val">{ minified: true }</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">wc_2026/lit-runtime</span>

<span class="var">wc_2026/button</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/components/wc-button.js</span>: <span class="val">{ minified: true }</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">wc_2026/lit-runtime</span>

<span class="var">wc_2026/accordion</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/components/wc-accordion.js</span>: <span class="val">{ minified: true }</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">wc_2026/lit-runtime</span>`;

export const codeLoadingHybridGroups = `<span class="cmt"># Smart bundles - grouped by usage context</span>
<span class="var">wc_2026/core</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/groups/core.js</span>: <span class="val">{ minified: true }</span>
  <span class="cmt"># button, badge, spinner, avatar (~32KB)</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">wc_2026/lit-runtime</span>

<span class="var">wc_2026/navigation</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/groups/navigation.js</span>: <span class="val">{ minified: true }</span>
  <span class="cmt"># nav, breadcrumb, tabs, sidebar (~28KB)</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">wc_2026/core</span>

<span class="var">wc_2026/content</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/groups/content.js</span>: <span class="val">{ minified: true }</span>
  <span class="cmt"># card, hero, accordion, modal (~45KB)</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">wc_2026/core</span>

<span class="var">wc_2026/forms</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/groups/forms.js</span>: <span class="val">{ minified: true }</span>
  <span class="cmt"># text-input, select, checkbox, radio (~38KB)</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">wc_2026/core</span>`;

export const codeLoadingTwigAttach = `<span class="cmt">{# In paragraph--card.html.twig #}</span>
{{ <span class="fn">attach_library</span>(<span class="str">'wc_2026/card'</span>) }}

&lt;<span class="tag">wc-card</span> <span class="attr">variant</span>=<span class="val">"elevated"</span>&gt;
  &lt;<span class="tag">img</span> <span class="slot-hl">slot="media"</span> <span class="attr">src</span>=<span class="val">"{{ image_url }}"</span> /&gt;
  &lt;<span class="tag">h3</span> <span class="slot-hl">slot="heading"</span>&gt;{{ title }}&lt;/<span class="tag">h3</span>&gt;
  &lt;<span class="tag">div</span> <span class="slot-hl">slot="body"</span>&gt;{{ body }}&lt;/<span class="tag">div</span>&gt;
&lt;/<span class="tag">wc-card</span>&gt;

<span class="cmt">{# Drupal only loads wc-card.js + lit-runtime.js #}</span>
<span class="cmt">{# Total: ~18KB for this page (not 220KB!) #}</span>`;

export const codeLoadingSharedRuntime = `<span class="cmt"># Shared Lit runtime - loaded once, cached forever</span>
<span class="var">wc_2026/lit-runtime</span>:
  <span class="prop-hl">js</span>:
    <span class="str">dist/vendor/lit-core.js</span>: <span class="val">{ minified: true }</span>
  <span class="kw">dependencies</span>:
    - <span class="attr">core/drupal</span>
    - <span class="attr">core/once</span>
  <span class="cmt"># ~15KB gzipped - Lit 3 runtime</span>
  <span class="cmt"># Cached across ALL pages after first load</span>`;

// ─── Tab 4: Light DOM Architecture ──────────────────────────────────────────

export const codeAdoptedController = `<span class="kw">import</span> { <span class="var">LitElement</span>, <span class="var">html</span> } <span class="kw">from</span> <span class="str">'lit'</span>;
<span class="kw">import</span> { <span class="var">customElement</span> } <span class="kw">from</span> <span class="str">'lit/decorators.js'</span>;
<span class="kw">import</span> { <span class="var">AdoptedStylesheetsController</span> } <span class="kw">from</span>
  <span class="str">'../../controllers/adopted-stylesheets.js'</span>;
<span class="kw">import</span> { <span class="var">wcProseScopedCss</span> } <span class="kw">from</span> <span class="str">'./wc-prose.styles.js'</span>;

@<span class="fn">customElement</span>(<span class="str">'wc-prose'</span>)
<span class="kw">export class</span> <span class="var">WcProse</span> <span class="kw">extends</span> <span class="var">LitElement</span> {
  <span class="cmt">// Render in Light DOM — no shadow boundary</span>
  <span class="kw">override</span> <span class="fn">createRenderRoot</span>(): <span class="var">this</span> {
    <span class="kw">return this</span>;
  }

  <span class="cmt">// Inject scoped CSS via adoptedStyleSheets</span>
  <span class="kw">private</span> _styles = <span class="kw">new</span> <span class="fn">AdoptedStylesheetsController</span>(
    <span class="kw">this</span>, <span class="var">wcProseScopedCss</span>, <span class="var">document</span>
  );
}`;

export const codeLightDomPattern = `<span class="cmt">// The createRenderRoot() pattern</span>
<span class="kw">override</span> <span class="fn">createRenderRoot</span>(): <span class="var">HTMLElement</span> {
  <span class="kw">return this</span>;  <span class="cmt">// ← returns the host, not a shadow root</span>
}

<span class="cmt">// Children are rendered into the Light DOM</span>
<span class="kw">override</span> <span class="fn">render</span>() {
  <span class="kw">return</span> <span class="fn">html</span><span class="str">\`&lt;slot&gt;&lt;/slot&gt;\`</span>;
}

<span class="cmt">// CSS is injected via adoptedStyleSheets, not :host{}</span>
<span class="cmt">// Selectors use the tag name: wc-prose h2 { ... }</span>`;

export const codeDrupalWysiwyg = `<span class="cmt">&lt;!-- Raw CKEditor output from Drupal --&gt;</span>
&lt;<span class="tag">div</span> <span class="attr">class</span>=<span class="val">"field field--name-body"</span>&gt;
  &lt;<span class="tag">div</span> <span class="attr">class</span>=<span class="val">"field__item"</span>&gt;
    &lt;<span class="tag">h2</span>&gt;Patient Portal Overview&lt;/<span class="tag">h2</span>&gt;
    &lt;<span class="tag">p</span>&gt;Welcome to the new patient...&lt;/<span class="tag">p</span>&gt;
    &lt;<span class="tag">div</span> <span class="attr">class</span>=<span class="val">"media media--type-image"</span>&gt;
      &lt;<span class="tag">img</span> <span class="attr">src</span>=<span class="val">"/files/hero.jpg"</span> <span class="attr">alt</span>=<span class="val">"..."</span> /&gt;
    &lt;/<span class="tag">div</span>&gt;
    &lt;<span class="tag">table</span>&gt;
      &lt;<span class="tag">thead</span>&gt;&lt;<span class="tag">tr</span>&gt;&lt;<span class="tag">th</span>&gt;Metric&lt;/<span class="tag">th</span>&gt;&lt;<span class="tag">th</span>&gt;Value&lt;/<span class="tag">th</span>&gt;&lt;/<span class="tag">tr</span>&gt;&lt;/<span class="tag">thead</span>&gt;
      &lt;<span class="tag">tbody</span>&gt;&lt;<span class="tag">tr</span>&gt;&lt;<span class="tag">td</span>&gt;BP&lt;/<span class="tag">td</span>&gt;&lt;<span class="tag">td</span>&gt;120/80&lt;/<span class="tag">td</span>&gt;&lt;/<span class="tag">tr</span>&gt;&lt;/<span class="tag">tbody</span>&gt;
    &lt;/<span class="tag">table</span>&gt;
    &lt;<span class="tag">blockquote</span>&gt;
      &lt;<span class="tag">p</span>&gt;"Excellent care experience"&lt;/<span class="tag">p</span>&gt;
    &lt;/<span class="tag">blockquote</span>&gt;
  &lt;/<span class="tag">div</span>&gt;
&lt;/<span class="tag">div</span>&gt;`;

export const codeProseWrapper = `<span class="cmt">{# In node--article.html.twig #}</span>
&lt;<span class="tag">wc-prose</span> <span class="prop-hl">size</span>=<span class="val">"base"</span> <span class="prop-hl">max-width</span>=<span class="val">"720px"</span>&gt;
  {{ content.body }}
&lt;/<span class="tag">wc-prose</span>&gt;

<span class="cmt">{# CKEditor output is now styled with:</span>
<span class="cmt">   - Consistent typography</span>
<span class="cmt">   - Responsive tables</span>
<span class="cmt">   - Styled blockquotes</span>
<span class="cmt">   - Media embed treatment</span>
<span class="cmt">   - Code block highlighting #}</span>`;

export const codeFormStandalone = `<span class="cmt">{# Standalone mode — wc-form renders &lt;form&gt; #}</span>
&lt;<span class="tag">wc-form</span>
  <span class="prop-hl">action</span>=<span class="val">"/api/contact"</span>
  <span class="prop-hl">method</span>=<span class="val">"post"</span>
&gt;
  &lt;<span class="tag">wc-text-input</span>
    <span class="prop-hl">name</span>=<span class="val">"email"</span>
    <span class="prop-hl">type</span>=<span class="val">"email"</span>
    <span class="prop-hl">required</span>
  &gt;
    &lt;<span class="tag">span</span> <span class="slot-hl">slot="label"</span>&gt;Email&lt;/<span class="tag">span</span>&gt;
  &lt;/<span class="tag">wc-text-input</span>&gt;

  &lt;<span class="tag">wc-button</span> <span class="prop-hl">type</span>=<span class="val">"submit"</span>&gt;Send&lt;/<span class="tag">wc-button</span>&gt;
&lt;/<span class="tag">wc-form</span>&gt;`;

export const codeFormDrupal = `<span class="cmt">{# Drupal mode — Drupal provides &lt;form&gt;, wc-form is bare wrapper #}</span>
{{ <span class="fn">attach_library</span>(<span class="str">'wc_2026/form'</span>) }}

&lt;<span class="tag">wc-form</span>&gt;
  <span class="cmt">{# Drupal's Form API renders the actual &lt;form&gt; tag #}</span>
  {{ content }}
&lt;/<span class="tag">wc-form</span>&gt;

<span class="cmt">{# wc-form only injects styling via adoptedStyleSheets.</span>
<span class="cmt">   No &lt;form&gt; is rendered — Drupal owns the form element,</span>
<span class="cmt">   CSRF tokens, and submission handling. #}</span>`;

export const codeFormInternals = `<span class="cmt">// ElementInternals in WcTextInput</span>
<span class="kw">static</span> <span class="var">formAssociated</span> = <span class="val">true</span>;

<span class="kw">private</span> _internals = <span class="kw">this</span>.<span class="fn">attachInternals</span>();

<span class="kw">override</span> <span class="fn">updated</span>(<span class="var">changed</span>: <span class="var">Map</span>&lt;<span class="var">string</span>, <span class="var">unknown</span>&gt;) {
  <span class="kw">if</span> (changed.<span class="fn">has</span>(<span class="str">'value'</span>)) {
    <span class="cmt">// Report value to the parent &lt;form&gt;</span>
    <span class="kw">this</span>._internals.<span class="fn">setFormValue</span>(<span class="kw">this</span>.<span class="var">value</span>);

    <span class="cmt">// Report validity state</span>
    <span class="kw">if</span> (<span class="kw">this</span>.<span class="var">required</span> &amp;&amp; !<span class="kw">this</span>.<span class="var">value</span>) {
      <span class="kw">this</span>._internals.<span class="fn">setValidity</span>(
        { <span class="attr">valueMissing</span>: <span class="val">true</span> },
        <span class="str">'This field is required'</span>
      );
    } <span class="kw">else</span> {
      <span class="kw">this</span>._internals.<span class="fn">setValidity</span>({});
    }
  }
}`;

export const codeScopedCss = `<span class="cmt">/* Scoped selectors — tag-qualified */</span>
<span class="tag">wc-prose</span> <span class="tag">h2</span> {
  <span class="attr">font-size</span>: <span class="fn">var</span>(<span class="var">--wc-font-size-xl</span>);
  <span class="attr">margin-top</span>: <span class="fn">var</span>(<span class="var">--wc-space-8</span>);
  <span class="attr">color</span>: <span class="fn">var</span>(<span class="var">--wc-color-text-strong</span>);
}

<span class="tag">wc-prose</span> .<span class="attr">media-embed</span> {
  <span class="attr">border-radius</span>: <span class="fn">var</span>(<span class="var">--wc-radius-lg</span>);
  <span class="attr">overflow</span>: <span class="val">hidden</span>;
  <span class="attr">margin</span>: <span class="fn">var</span>(<span class="var">--wc-space-6</span>) <span class="val">0</span>;
}

<span class="tag">wc-prose</span> <span class="tag">table</span> {
  <span class="attr">width</span>: <span class="val">100%</span>;
  <span class="attr">border-collapse</span>: <span class="val">collapse</span>;
  <span class="attr">font-size</span>: <span class="fn">var</span>(<span class="var">--wc-font-size-sm</span>);
}

<span class="tag">wc-prose</span> <span class="tag">blockquote</span> {
  <span class="attr">border-left</span>: <span class="val">3px</span> <span class="val">solid</span> <span class="fn">var</span>(<span class="var">--wc-color-primary</span>);
  <span class="attr">padding-left</span>: <span class="fn">var</span>(<span class="var">--wc-space-4</span>);
  <span class="attr">font-style</span>: <span class="val">italic</span>;
}`;

export const codeExampleForm = `&lt;<span class="tag">wc-text-input</span>
  <span class="prop-hl">name</span>=<span class="val">"{{ field_name }}"</span>
  <span class="prop-hl">type</span>=<span class="val">"{{ field_type }}"</span>
  <span class="prop-hl">required</span>
  <span class="prop-hl">pattern</span>=<span class="val">"{{ validation_pattern }}"</span>
  <span class="prop-hl">maxlength</span>=<span class="val">"{{ max_length }}"</span>
&gt;
  <span class="cmt">&lt;!-- Slots for custom content --&gt;</span>
  &lt;<span class="tag">span</span> <span class="slot-hl">slot="label"</span>&gt;
    {{ field_label }}
    {% <span class="kw">if</span> required %}
      &lt;<span class="tag">abbr</span> <span class="attr">title</span>=<span class="val">"required"</span>&gt;*&lt;/<span class="tag">abbr</span>&gt;
    {% <span class="kw">endif</span> %}
  &lt;/<span class="tag">span</span>&gt;

  &lt;<span class="tag">span</span> <span class="slot-hl">slot="help"</span>&gt;
    {{ field_description }}
  &lt;/<span class="tag">span</span>&gt;

  &lt;<span class="tag">span</span> <span class="slot-hl">slot="error"</span>&gt;
    {{ error_message }}
  &lt;/<span class="tag">span</span>&gt;
&lt;/<span class="tag">wc-text-input</span>&gt;`;
