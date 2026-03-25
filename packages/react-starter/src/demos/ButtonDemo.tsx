import { useState } from 'react';
import { HxButton } from '@helixui/react';

const variants = ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline'] as const;

const sizes = ['sm', 'md', 'lg'] as const;

export function ButtonDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [loading, setLoading] = useState(false);

  function handleLoadingClick() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Button Demo</h2>

      <h3>Variants</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {variants.map((variant) => (
          <HxButton key={variant} variant={variant}>
            {variant}
          </HxButton>
        ))}
      </div>

      <h3>Sizes</h3>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {sizes.map((size) => (
          <HxButton key={size} size={size} variant="primary">
            {size}
          </HxButton>
        ))}
      </div>

      <h3>Event handling</h3>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <HxButton variant="primary" onHxClick={() => setClickCount((c) => c + 1)}>
          Click me
        </HxButton>
        <span>
          Clicked <strong>{clickCount}</strong> time
          {clickCount !== 1 ? 's' : ''}
        </span>
      </div>

      <h3>Loading state</h3>
      <HxButton variant="secondary" loading={loading} onHxClick={handleLoadingClick}>
        {loading ? 'Processing...' : 'Simulate async action'}
      </HxButton>

      <h3>Disabled</h3>
      <HxButton variant="primary" disabled>
        Disabled button
      </HxButton>

      <h3>Full width</h3>
      <HxButton variant="outline" full>
        Full-width button
      </HxButton>
    </section>
  );
}
