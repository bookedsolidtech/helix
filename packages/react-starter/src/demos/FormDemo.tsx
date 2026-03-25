import { useState } from 'react';
import { HxTextInput, HxButton } from '@helixui/react';

interface FormState {
  name: string;
  email: string;
  phone: string;
}

export function FormDemo() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);

  function handleInput(field: keyof FormState) {
    return (e: Event) => {
      const target = e.target as HTMLElement & { value: string };
      setForm((prev) => ({ ...prev, [field]: target.value }));
    };
  }

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Form Demo</h2>
      <p>Text inputs with validation, typed event handling, and React state binding.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
        <HxTextInput
          label="Full name"
          placeholder="Jane Doe"
          value={form.name}
          required
          onHxInput={handleInput('name')}
        />

        <HxTextInput
          label="Email address"
          type="email"
          placeholder="jane@example.com"
          value={form.email}
          required
          helpText="We will never share your email."
          onHxInput={handleInput('email')}
        />

        <HxTextInput
          label="Phone number"
          type="tel"
          placeholder="(555) 123-4567"
          value={form.phone}
          pattern="[0-9()+\\-\\s]+"
          helpText="Optional. Digits, parentheses, dashes, and spaces only."
          onHxInput={handleInput('phone')}
        />

        <HxTextInput label="Read-only field" value="This value cannot be changed" readonly />

        <HxTextInput
          label="Error state"
          value="bad-email"
          type="email"
          error="Please enter a valid email address."
        />

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <HxButton variant="primary" onHxClick={handleSubmit}>
            Submit
          </HxButton>
          {submitted && (
            <span style={{ color: 'green' }}>
              Submitted: {form.name}, {form.email}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
