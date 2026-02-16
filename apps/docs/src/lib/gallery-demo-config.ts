/**
 * Curated demo HTML for each component in the gallery.
 * Runs at build time — strings are injected via set:html.
 */

export interface DemoConfig {
  primary: string;
  primaryLabel?: string;
}

const DEMO_MAP: Record<string, DemoConfig> = {
  'hx-button': {
    primaryLabel: 'Variants & Sizes',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1.5rem;align-items:flex-start;">
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <hx-button variant="primary">Primary Action</hx-button>
          <hx-button variant="secondary">Secondary</hx-button>
          <hx-button variant="ghost">Ghost</hx-button>
          <hx-button variant="primary" disabled>Disabled</hx-button>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <hx-button variant="primary" wc-size="sm">Small</hx-button>
          <hx-button variant="primary" wc-size="md">Medium</hx-button>
          <hx-button variant="primary" wc-size="lg">Large</hx-button>
        </div>
      </div>`,
  },

  'hx-alert': {
    primaryLabel: 'Status Notifications',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <hx-alert variant="info">Your article has been updated successfully.</hx-alert>
        <hx-alert variant="success">New content is now available for review.</hx-alert>
        <hx-alert variant="warning">Scheduled publish date is approaching — please review.</hx-alert>
        <hx-alert variant="error" closable>Critical: Unable to connect to content API.</hx-alert>
      </div>`,
  },

  'hx-badge': {
    primaryLabel: 'Status Indicators',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1.25rem;">
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <hx-badge variant="primary">Active</hx-badge>
          <hx-badge variant="success">Verified</hx-badge>
          <hx-badge variant="warning">Pending Review</hx-badge>
          <hx-badge variant="error">Critical</hx-badge>
          <hx-badge variant="neutral">Archived</hx-badge>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
          <hx-badge variant="success" pill>Compliant</hx-badge>
          <hx-badge variant="error" pill pulse>STAT</hx-badge>
          <hx-badge variant="primary" wc-size="sm">SM</hx-badge>
          <hx-badge variant="primary" wc-size="lg">Large</hx-badge>
        </div>
      </div>`,
  },

  'hx-card': {
    primaryLabel: 'Card Variants',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
        <hx-card variant="default">
          <span slot="header">Article Summary</span>
          <p>View article details, author information, and engagement metrics.</p>
        </hx-card>
        <hx-card variant="featured">
          <span slot="header">Featured Content</span>
          <p>Highlighted articles with trending topics and editorial picks.</p>
        </hx-card>
        <hx-card variant="compact" wc-href="#">
          <span slot="header">Quick Link</span>
          <p>Interactive card that navigates on click.</p>
        </hx-card>
      </div>`,
  },

  'hx-container': {
    primaryLabel: 'Layout Widths',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <hx-container width="narrow" padding="md" style="background:rgba(6,182,212,0.08);border:1px dashed rgba(6,182,212,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Narrow container (640px)</div>
        </hx-container>
        <hx-container width="content" padding="md" style="background:rgba(139,92,246,0.08);border:1px dashed rgba(139,92,246,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Content container (960px)</div>
        </hx-container>
        <hx-container width="full" padding="md" style="background:rgba(16,185,129,0.08);border:1px dashed rgba(16,185,129,0.3);border-radius:8px;">
          <div style="text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.7);">Full-width container</div>
        </hx-container>
      </div>`,
  },

  'hx-prose': {
    primaryLabel: 'Rich Text Content',
    primary: `
      <hx-prose>
        <h3>Editorial Style Guide</h3>
        <p>All published content must follow the <strong>enterprise style guide</strong> for consistent voice and formatting. This ensures quality across all content channels.</p>
        <ul>
          <li>Use consistent terminology and brand voice</li>
          <li>Include author attribution on every article</li>
          <li>Follow the editorial review process before publication</li>
        </ul>
        <blockquote>
          <p>"Good content is the foundation of great user experiences."</p>
        </blockquote>
      </hx-prose>`,
  },

  'hx-text-input': {
    primaryLabel: 'Input States',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;">
        <hx-text-input label="Email Address" type="email" placeholder="user@example.com" help-text="Used for notifications"></hx-text-input>
        <hx-text-input label="Article ID" placeholder="ART-000000" required></hx-text-input>
        <hx-text-input label="Password" type="password" placeholder="Enter password" error="Password must be at least 12 characters"></hx-text-input>
        <hx-text-input label="Search Articles" type="search" placeholder="Search by title or author" disabled></hx-text-input>
      </div>`,
  },

  'hx-textarea': {
    primaryLabel: 'Multi-line Input',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;">
        <hx-textarea label="Article Summary" placeholder="Enter article summary..." rows="4" help-text="Brief description for search results"></hx-textarea>
        <hx-textarea label="Editor Notes" placeholder="Add editorial notes..." rows="4" maxlength="500" show-count></hx-textarea>
      </div>`,
  },

  'hx-select': {
    primaryLabel: 'Dropdown Selection',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;">
        <hx-select label="Category" placeholder="Select category" help-text="Primary content category">
          <option value="news">News</option>
          <option value="guides">Guides</option>
          <option value="tutorials">Tutorials</option>
          <option value="opinion">Opinion</option>
          <option value="reviews">Reviews</option>
        </hx-select>
        <hx-select label="Priority" placeholder="Select priority" error="Priority is required" required>
          <option value="standard">Standard</option>
          <option value="featured">Featured</option>
          <option value="breaking">Breaking</option>
        </hx-select>
      </div>`,
  },

  'hx-checkbox': {
    primaryLabel: 'Checkbox States',
    primary: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <hx-checkbox label="I confirm the content has been reviewed" checked></hx-checkbox>
        <hx-checkbox label="Author has approved publication" help-text="Required before publishing"></hx-checkbox>
        <hx-checkbox label="Categories have been assigned" error="This field is required" required></hx-checkbox>
        <hx-checkbox label="Previous acknowledgment (read-only)" checked disabled></hx-checkbox>
      </div>`,
  },

  'hx-radio-group': {
    primaryLabel: 'Radio Selection',
    primary: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;">
        <hx-radio-group label="Content Type" name="content-type" help-text="Select the article format">
          <hx-radio value="article" label="Article"></hx-radio>
          <hx-radio value="listicle" label="Listicle"></hx-radio>
          <hx-radio value="interview" label="Interview"></hx-radio>
          <hx-radio value="review" label="Review"></hx-radio>
        </hx-radio-group>
        <hx-radio-group label="Publish Status" name="publish-status" orientation="horizontal">
          <hx-radio value="draft" label="Draft"></hx-radio>
          <hx-radio value="review" label="In Review"></hx-radio>
          <hx-radio value="published" label="Published"></hx-radio>
        </hx-radio-group>
      </div>`,
  },

  'hx-switch': {
    primaryLabel: 'Toggle Controls',
    primary: `
      <div style="display:flex;flex-direction:column;gap:1rem;">
        <hx-switch label="Enable email notifications" checked></hx-switch>
        <hx-switch label="Share article with social channels" help-text="Author approval required"></hx-switch>
        <hx-switch label="High-contrast mode" wc-size="lg"></hx-switch>
        <hx-switch label="Legacy system (locked)" disabled checked></hx-switch>
      </div>`,
  },

  'hx-form': {
    primaryLabel: 'Author Submission Form',
    primary: `
      <hx-form name="author-submission">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1rem;">
          <hx-text-input label="Article Title" name="title" placeholder="Enter title" required></hx-text-input>
          <hx-text-input label="Author Name" name="author" placeholder="Jane Doe" required></hx-text-input>
          <hx-text-input label="Publish Date" name="publish-date" type="text" placeholder="MM/DD/YYYY" required></hx-text-input>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1rem;">
          <hx-select label="Category" name="category" placeholder="Select category">
            <option value="news">News</option>
            <option value="guides">Guides</option>
            <option value="opinion">Opinion</option>
            <option value="tutorials">Tutorials</option>
          </hx-select>
          <hx-text-input label="Tags" name="tags" placeholder="tag1, tag2, tag3"></hx-text-input>
        </div>
        <hx-checkbox label="I confirm this content is ready for review" required style="margin-bottom:1rem;"></hx-checkbox>
        <hx-button variant="primary" type="submit">Submit Article</hx-button>
      </hx-form>`,
  },
};

export function getDemoConfig(tagName: string): DemoConfig {
  return (
    DEMO_MAP[tagName] ?? {
      primary: `<${tagName}></${tagName}>`,
      primaryLabel: tagName,
    }
  );
}
