'use client';

// Side-effect import: registers all hx-* custom elements in the browser
import '@helixui/library';

import { HxButton, HxCard, HxText } from '@helixui/react';
import PatientRegistrationForm from './components/PatientRegistrationForm.tsx';

export default function App() {
  function handleHeaderClick(event: Event) {
    console.log('Header button clicked', event);
  }

  function handleSecondaryClick(event: Event) {
    console.log('Secondary button clicked', event);
  }

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header section */}
      <header style={{ marginBottom: '2rem' }}>
        <HxText variant="body-lg" weight="bold" as="p">
          HELiX React Starter
        </HxText>
        <HxText variant="body" color="subtle" as="p" style={{ marginTop: '0.5rem' }}>
          Demonstrating @helixui/react web component wrappers with typed event handlers.
        </HxText>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <HxButton variant="primary" onHxClick={handleHeaderClick}>
            Primary Action
          </HxButton>
          <HxButton variant="secondary" onHxClick={handleSecondaryClick}>
            Secondary Action
          </HxButton>
          <HxButton variant="ghost" disabled>
            Disabled
          </HxButton>
        </div>
      </header>

      {/* Patient registration form example */}
      <HxCard>
        <div style={{ padding: '1.5rem' }}>
          <HxText variant="body-lg" weight="semibold" as="p" style={{ marginBottom: '1.25rem' }}>
            Patient Registration
          </HxText>
          <PatientRegistrationForm />
        </div>
      </HxCard>
    </div>
  );
}
