/**
 * SDC Render Tests
 *
 * Validates that every SDC template in drupal-starter renders valid HTML
 * containing the expected hx-* custom elements when given representative props.
 *
 * Five "feature SDCs" receive detailed assertions; the remaining 24 receive
 * smoke tests (renders without error, output is a non-empty string).
 */

import { describe, it, expect } from 'vitest';
import { makeAttributes, renderSdc, renderTemplate } from './helpers/twig-setup.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert the output is a non-empty string — basic smoke test. */
function expectNonEmpty(output: string, name: string): void {
  expect(typeof output, `${name}: output should be a string`).toBe('string');
  expect(output.trim().length, `${name}: output should not be empty`).toBeGreaterThan(0);
}

/** Assert the output contains a given hx-* element open tag. */
function expectElement(output: string, tag: string, context: string): void {
  expect(output, `${context}: expected <${tag}>`).toContain(`<${tag}`);
}

// ---------------------------------------------------------------------------
// Feature SDC: article-teaser
// ---------------------------------------------------------------------------

describe('article-teaser', () => {
  const base = {
    title: 'How AI is Changing Patient Care',
    url: '/articles/ai-patient-care',
    body: 'Artificial intelligence is transforming how clinicians diagnose and treat patients.',
  };

  it('renders without error', () => {
    const output = renderSdc('article-teaser', base);
    expectNonEmpty(output, 'article-teaser');
  });

  it('contains hx-card', () => {
    const output = renderSdc('article-teaser', base);
    expectElement(output, 'hx-card', 'article-teaser');
  });

  it('contains hx-text', () => {
    const output = renderSdc('article-teaser', base);
    expectElement(output, 'hx-text', 'article-teaser');
  });

  it('renders title text in output', () => {
    const output = renderSdc('article-teaser', base);
    expect(output).toContain(base.title);
  });

  it('renders body text in output', () => {
    const output = renderSdc('article-teaser', base);
    expect(output).toContain(base.body);
  });

  it('renders hx-link with the given url', () => {
    const output = renderSdc('article-teaser', base);
    expect(output).toContain(`href="${base.url}"`);
    expectElement(output, 'hx-link', 'article-teaser (link)');
  });

  it('renders hx-badge when category is provided', () => {
    const output = renderSdc('article-teaser', { ...base, category: 'Cardiology' });
    expectElement(output, 'hx-badge', 'article-teaser (category)');
    expect(output).toContain('Cardiology');
  });

  it('does not render hx-link when url is omitted', () => {
    const { url: _url, ...noUrl } = base;
    const output = renderSdc('article-teaser', noUrl);
    expect(output).not.toContain('<hx-link');
  });

  it('renders hx-image when image_url is provided', () => {
    const output = renderSdc('article-teaser', {
      ...base,
      image_url: '/images/ai-care.jpg',
      image_alt: 'AI in healthcare',
    });
    expectElement(output, 'hx-image', 'article-teaser (image)');
    expect(output).toContain('slot="image"');
  });

  it('renders hx-avatar and author name when author_name is provided', () => {
    const output = renderSdc('article-teaser', { ...base, author_name: 'Dr. Smith' });
    expectElement(output, 'hx-avatar', 'article-teaser (author)');
    expect(output).toContain('Dr. Smith');
  });

  it('applies article-teaser class via attributes', () => {
    const output = renderSdc('article-teaser', {
      ...base,
      attributes: makeAttributes(),
    });
    expect(output).toContain('article-teaser');
  });
});

// ---------------------------------------------------------------------------
// Feature SDC: provider-card
// ---------------------------------------------------------------------------

describe('provider-card', () => {
  const base = {
    name: 'Dr. Jane Doe',
    credentials: 'MD, FACC',
    specialty: 'Cardiology',
  };

  it('renders without error', () => {
    const output = renderSdc('provider-card', base);
    expectNonEmpty(output, 'provider-card');
  });

  it('renders hx-card', () => {
    const output = renderSdc('provider-card', base);
    expectElement(output, 'hx-card', 'provider-card');
  });

  it('renders hx-text', () => {
    const output = renderSdc('provider-card', base);
    expectElement(output, 'hx-text', 'provider-card');
  });

  it('renders hx-status-indicator', () => {
    const output = renderSdc('provider-card', base);
    expectElement(output, 'hx-status-indicator', 'provider-card');
  });

  it('renders provider name', () => {
    const output = renderSdc('provider-card', base);
    expect(output).toContain('Dr. Jane Doe');
  });

  it('renders credentials when provided', () => {
    const output = renderSdc('provider-card', base);
    expect(output).toContain('MD, FACC');
  });

  it('renders specialty badge', () => {
    const output = renderSdc('provider-card', base);
    expectElement(output, 'hx-badge', 'provider-card (specialty)');
    expect(output).toContain('Cardiology');
  });

  it('sets status="active" when accepting_patients is true', () => {
    const output = renderSdc('provider-card', { ...base, accepting_patients: true });
    expect(output).toContain('status="active"');
    expect(output).toContain('Accepting new patients');
  });

  it('sets status="inactive" when accepting_patients is false', () => {
    const output = renderSdc('provider-card', { ...base, accepting_patients: false });
    expect(output).toContain('status="inactive"');
    expect(output).toContain('Not accepting new patients');
  });

  it('defaults to accepting_patients=true (status="active") when prop omitted', () => {
    const output = renderSdc('provider-card', base);
    expect(output).toContain('status="active"');
  });

  it('renders hx-button with profile link when url is provided', () => {
    const output = renderSdc('provider-card', { ...base, url: '/providers/jane-doe' });
    expectElement(output, 'hx-button', 'provider-card (cta)');
    expect(output).toContain('/providers/jane-doe');
  });

  it('renders hx-rating when rating is provided', () => {
    const output = renderSdc('provider-card', { ...base, rating: 4.5 });
    expectElement(output, 'hx-rating', 'provider-card (rating)');
    expect(output).toContain('value="4.5"');
  });
});

// ---------------------------------------------------------------------------
// Feature SDC: hero-banner
// ---------------------------------------------------------------------------

describe('hero-banner', () => {
  const base = {
    title: 'World-Class Healthcare, Close to Home',
    subtitle: 'Serving patients since 1950.',
  };

  it('renders without error', () => {
    const output = renderSdc('hero-banner', base);
    expectNonEmpty(output, 'hero-banner');
  });

  it('contains hx-text', () => {
    const output = renderSdc('hero-banner', base);
    expectElement(output, 'hx-text', 'hero-banner');
  });

  it('renders title in hx-text output', () => {
    const output = renderSdc('hero-banner', base);
    expect(output).toContain(base.title);
  });

  it('renders subtitle when provided', () => {
    const output = renderSdc('hero-banner', base);
    expect(output).toContain(base.subtitle);
  });

  it('renders hx-button with cta_url and cta_text when both are provided', () => {
    const output = renderSdc('hero-banner', {
      ...base,
      cta_text: 'Book Appointment',
      cta_url: '/book',
    });
    expectElement(output, 'hx-button', 'hero-banner (cta)');
    expect(output).toContain('Book Appointment');
    expect(output).toContain('href="/book"');
  });

  it('does not render hx-button when cta_text is missing', () => {
    const output = renderSdc('hero-banner', { ...base, cta_url: '/book' });
    expect(output).not.toContain('<hx-button');
  });

  it('does not render hx-button when cta_url is missing', () => {
    const output = renderSdc('hero-banner', { ...base, cta_text: 'Book Now' });
    expect(output).not.toContain('<hx-button');
  });

  it('renders hx-image when image_url is provided', () => {
    const output = renderSdc('hero-banner', {
      ...base,
      image_url: '/images/hero.jpg',
      image_alt: 'Hospital exterior',
    });
    expectElement(output, 'hx-image', 'hero-banner (image)');
  });

  it('renders a <section> element', () => {
    const output = renderSdc('hero-banner', base);
    expect(output).toContain('<section');
  });

  it('applies default center alignment class', () => {
    const output = renderSdc('hero-banner', base);
    expect(output).toContain('hero-banner--align-center');
  });

  it('applies custom alignment class', () => {
    const output = renderSdc('hero-banner', { ...base, alignment: 'left' });
    expect(output).toContain('hero-banner--align-left');
  });
});

// ---------------------------------------------------------------------------
// Feature SDC: contact-form
// ---------------------------------------------------------------------------

describe('contact-form', () => {
  const base = { title: 'Get in Touch', action: '/contact/submit' };

  it('renders without error', () => {
    const output = renderSdc('contact-form', base);
    expectNonEmpty(output, 'contact-form');
  });

  it('renders hx-text with the title', () => {
    const output = renderSdc('contact-form', base);
    expectElement(output, 'hx-text', 'contact-form (title)');
    expect(output).toContain('Get in Touch');
  });

  it('renders hx-text-input fields', () => {
    const output = renderSdc('contact-form', base);
    expectElement(output, 'hx-text-input', 'contact-form (input)');
  });

  it('renders hx-button submit', () => {
    const output = renderSdc('contact-form', base);
    expectElement(output, 'hx-button', 'contact-form (button)');
    expect(output).toContain('type="submit"');
  });

  it('renders hx-select', () => {
    const output = renderSdc('contact-form', base);
    expectElement(output, 'hx-select', 'contact-form (select)');
  });

  it('renders hx-textarea', () => {
    const output = renderSdc('contact-form', base);
    expectElement(output, 'hx-textarea', 'contact-form (textarea)');
  });

  it('defaults title to "Contact Us" when omitted', () => {
    const output = renderSdc('contact-form', { action: '/submit' });
    expect(output).toContain('Contact Us');
  });

  it('renders form with the given action', () => {
    const output = renderSdc('contact-form', base);
    expect(output).toContain(`action="${base.action}"`);
  });

  it('renders description when provided', () => {
    const output = renderSdc('contact-form', { ...base, description: 'We respond within 24 hours.' });
    expect(output).toContain('We respond within 24 hours.');
  });
});

// ---------------------------------------------------------------------------
// Feature SDC: search-form
// ---------------------------------------------------------------------------

describe('search-form', () => {
  const base = { action: '/search', label: 'Search our site' };

  it('renders without error', () => {
    const output = renderSdc('search-form', base);
    expectNonEmpty(output, 'search-form');
  });

  it('renders hx-text-input', () => {
    const output = renderSdc('search-form', base);
    expectElement(output, 'hx-text-input', 'search-form (input)');
  });

  it('renders hx-button', () => {
    const output = renderSdc('search-form', base);
    expectElement(output, 'hx-button', 'search-form (button)');
  });

  it('renders hx-icon', () => {
    const output = renderSdc('search-form', base);
    expectElement(output, 'hx-icon', 'search-form (icon)');
  });

  it('uses label for aria-label on the form', () => {
    const output = renderSdc('search-form', base);
    expect(output).toContain(`aria-label="${base.label}"`);
  });

  it('defaults label to "Search" when omitted', () => {
    const output = renderSdc('search-form', { action: '/search' });
    expect(output).toContain('aria-label="Search"');
  });

  it('renders form with method="get"', () => {
    const output = renderSdc('search-form', base);
    expect(output).toContain('method="get"');
  });

  it('renders role="search" on the form', () => {
    const output = renderSdc('search-form', base);
    expect(output).toContain('role="search"');
  });
});

// ---------------------------------------------------------------------------
// Smoke tests for remaining 24 SDCs
// ---------------------------------------------------------------------------

describe('SDC smoke tests — renders without error', () => {
  const smoke: Array<[string, Record<string, unknown>]> = [
    ['article-full', { title: 'Full Article', body: 'Body content.' }],
    ['author-byline', { name: 'Dr. Smith', role: 'Editor' }],
    ['breadcrumb-nav', {
      items: [
        { url: '/', title: 'Home' },
        { url: '/articles', title: 'Articles' },
        { url: '/articles/foo', title: 'Foo' },
      ],
    }],
    ['category-hero', { title: 'Cardiology', category: 'Specialty' }],
    ['condition-tag', { label: 'Hypertension', url: '/conditions/hypertension' }],
    ['featured-article', {
      title: 'Featured Story',
      url: '/featured',
      body: 'Story body.',
    }],
    ['landing-page', { title: 'Welcome', sections: '' }],
    ['main-nav', {
      items: [
        { url: '/', title: 'Home', children: [] },
        { url: '/about', title: 'About', children: [] },
      ],
    }],
    ['mobile-drawer', { items: [{ url: '/', title: 'Home' }] }],
    ['newsletter-signup', { title: 'Stay Updated', action: '/newsletter/subscribe' }],
    ['recipe-card', {
      title: 'Heart-Healthy Salad',
      url: '/recipes/salad',
    }],
    ['recipe-full', {
      title: 'Heart-Healthy Salad',
      ingredients: ['Spinach', 'Tomatoes'],
    }],
    ['related-articles', {
      title: 'Related Reading',
      items: [{ url: '/a', title: 'Article A', body: '' }],
    }],
    ['section-container', { title: 'Our Services', content: '<p>Services here</p>' }],
    ['share-buttons', { url: 'https://example.com/article', title: 'My Article' }],
    ['sidebar-nav', {
      title: 'Section Nav',
      items: [{ url: '/page', title: 'Page', active: false }],
    }],
    ['site-footer', { columns: '<div>Footer content</div>' }],
    ['site-header', { logo: '<img src="/logo.png" alt="Logo" />' }],
    ['tag-cloud', {
      tags: [
        { label: 'Cardiology', url: '/tags/cardiology', count: 10 },
        { label: 'Oncology', url: '/tags/oncology', count: 5 },
      ],
    }],
    ['topic-landing', { title: 'Oncology', description: 'Cancer care services.' }],
    ['views-carousel', { items: '<div>Slide 1</div><div>Slide 2</div>' }],
    ['views-grid', { items: '<div>Item 1</div><div>Item 2</div>' }],
    ['views-list', { items: '<li>Item 1</li><li>Item 2</li>' }],
    ['appointment-cta', {
      title: 'Book Your Appointment',
      cta_text: 'Schedule Now',
      cta_url: '/book',
    }],
  ];

  for (const [name, vars] of smoke) {
    it(`${name} — renders non-empty output`, () => {
      const output = renderSdc(name, vars);
      expectNonEmpty(output, name);
    });
  }
});

// ---------------------------------------------------------------------------
// Standalone template tests
// ---------------------------------------------------------------------------

describe('standalone template: hx-button.html.twig', () => {
  it('renders without error', () => {
    const output = renderTemplate('hx-button', { content: 'Click Me' });
    expectNonEmpty(output, 'hx-button template');
  });

  it('renders an <hx-button> element', () => {
    const output = renderTemplate('hx-button', { content: 'Click Me' });
    expectElement(output, 'hx-button', 'hx-button template');
  });

  it('defaults variant to primary', () => {
    const output = renderTemplate('hx-button', { content: 'Click Me' });
    expect(output).toContain('variant="primary"');
  });

  it('applies given variant', () => {
    const output = renderTemplate('hx-button', { variant: 'secondary', content: 'Cancel' });
    expect(output).toContain('variant="secondary"');
  });

  it('renders hx-icon slot prefix when icon_start is set', () => {
    const output = renderTemplate('hx-button', { content: 'Go', icon_start: 'arrow-right' });
    expect(output).toContain('slot="prefix"');
    expectElement(output, 'hx-icon', 'hx-button template icon_start');
  });

  it('renders disabled attribute when disabled is true', () => {
    const output = renderTemplate('hx-button', { content: 'Disabled', disabled: true });
    expect(output).toContain('disabled');
  });
});

describe('standalone template: hx-card.html.twig', () => {
  it('renders without error', () => {
    const output = renderTemplate('hx-card', { heading: 'Card Heading' });
    expectNonEmpty(output, 'hx-card template');
  });

  it('renders an <hx-card> element', () => {
    const output = renderTemplate('hx-card', { heading: 'Card Heading' });
    expectElement(output, 'hx-card', 'hx-card template');
  });

  it('defaults variant to default', () => {
    const output = renderTemplate('hx-card', { heading: 'Test' });
    expect(output).toContain('variant="default"');
  });

  it('renders heading text', () => {
    const output = renderTemplate('hx-card', { heading: 'Patient Summary' });
    expect(output).toContain('Patient Summary');
  });

  it('renders hx-image slot when image_url is provided', () => {
    const output = renderTemplate('hx-card', {
      heading: 'Card',
      image_url: '/img/card.jpg',
      image_alt: 'Card image',
    });
    expectElement(output, 'hx-image', 'hx-card template image');
    expect(output).toContain('slot="image"');
  });

  it('wraps heading in hx-link when url is provided', () => {
    const output = renderTemplate('hx-card', {
      heading: 'Read More',
      url: '/articles/123',
    });
    expect(output).toContain('href="/articles/123"');
  });

  it('renders footer slot content', () => {
    const output = renderTemplate('hx-card', {
      heading: 'Card',
      footer: '<hx-button>Action</hx-button>',
    });
    expect(output).toContain('slot="footer"');
    expect(output).toContain('<hx-button>Action</hx-button>');
  });
});

describe('standalone template: hx-text-input.html.twig', () => {
  it('renders without error', () => {
    const output = renderTemplate('hx-text-input', { name: 'patient_name', label: 'Patient Name' });
    expectNonEmpty(output, 'hx-text-input template');
  });

  it('renders an <hx-text-input> element', () => {
    const output = renderTemplate('hx-text-input', { name: 'email', label: 'Email' });
    expectElement(output, 'hx-text-input', 'hx-text-input template');
  });

  it('sets name attribute', () => {
    const output = renderTemplate('hx-text-input', { name: 'patient_id', label: 'Patient ID' });
    expect(output).toContain('name="patient_id"');
  });

  it('sets label attribute', () => {
    const output = renderTemplate('hx-text-input', { name: 'dob', label: 'Date of Birth' });
    expect(output).toContain('label="Date of Birth"');
  });

  it('sets required when required is truthy', () => {
    const output = renderTemplate('hx-text-input', { name: 'mrn', label: 'MRN', required: true });
    expect(output).toContain('required');
  });

  it('defaults type to text', () => {
    const output = renderTemplate('hx-text-input', { name: 'notes', label: 'Notes' });
    expect(output).toContain('type="text"');
  });
});

describe('standalone template: hx-form.html.twig', () => {
  it('renders without error', () => {
    const output = renderTemplate('hx-form', {
      title: 'Patient Intake',
      action: '/form/submit',
    });
    expectNonEmpty(output, 'hx-form template');
  });

  it('renders title heading', () => {
    const output = renderTemplate('hx-form', { title: 'Patient Intake', action: '/submit' });
    expect(output).toContain('Patient Intake');
  });

  it('renders hx-text-input elements', () => {
    const output = renderTemplate('hx-form', { action: '/submit' });
    expectElement(output, 'hx-text-input', 'hx-form template');
  });

  it('renders hx-button submit', () => {
    const output = renderTemplate('hx-form', { action: '/submit' });
    expectElement(output, 'hx-button', 'hx-form template button');
    expect(output).toContain('type="submit"');
  });

  it('renders hx-select', () => {
    const output = renderTemplate('hx-form', { action: '/submit' });
    expectElement(output, 'hx-select', 'hx-form template select');
  });
});
