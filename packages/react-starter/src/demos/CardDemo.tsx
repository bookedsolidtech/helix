import { HxCard, HxBadge } from '@helixui/react';

const cards: ReadonlyArray<{
  title: string;
  description: string;
  variant: 'default' | 'featured' | 'compact';
  elevation: 'flat' | 'raised' | 'floating';
  badge?: string;
  badgeVariant?: string;
}> = [
  {
    title: 'Patient Records',
    description: 'View and manage patient health records securely within the enterprise portal.',
    variant: 'default',
    elevation: 'raised',
    badge: 'Active',
  },
  {
    title: 'Lab Results',
    description:
      'Access laboratory results and diagnostic reports with HIPAA-compliant data handling.',
    variant: 'featured',
    elevation: 'floating',
    badge: 'New',
    badgeVariant: 'info',
  },
  {
    title: 'Appointments',
    description: 'Schedule and manage patient appointments.',
    variant: 'compact',
    elevation: 'flat',
  },
];

export function CardDemo() {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Card Demo</h2>
      <p>Card variants with badges, elevation levels, and slot composition.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {cards.map((card) => (
          <HxCard key={card.title} variant={card.variant} elevation={card.elevation}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <h3 style={{ margin: 0 }}>{card.title}</h3>
              {card.badge && <HxBadge>{card.badge}</HxBadge>}
            </div>
            <p>{card.description}</p>
          </HxCard>
        ))}
      </div>

      <h3>Interactive card (with link)</h3>
      <HxCard
        variant="default"
        elevation="raised"
        href="https://github.com/bookedsolidtech/helix"
        label="Visit HELiX repository on GitHub"
      >
        <h3 style={{ margin: 0 }}>HELiX on GitHub</h3>
        <p>Click this card to visit the repository.</p>
      </HxCard>
    </section>
  );
}
