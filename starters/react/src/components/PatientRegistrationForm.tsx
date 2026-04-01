'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { HxButton, HxCheckbox, HxHelpText, HxSelect, HxTextInput } from '@helixui/react';
import { useForm, Controller, type ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const patientSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or fewer'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or fewer'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date'),
  preferredContact: z.string().min(1, 'Please select a preferred contact method'),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to treatment to proceed',
  }),
});

type PatientFormValues = z.infer<typeof patientSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PatientRegistrationForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      preferredContact: '',
      consent: false,
    },
  });

  function onSubmit(data: PatientFormValues) {
    // In a real app, POST to your healthcare API here.
    console.log('Patient registration submitted:', data);
  }

  if (isSubmitSuccessful) {
    return (
      <div>
        <HxHelpText variant="success">
          Registration submitted successfully. A care coordinator will follow up shortly.
        </HxHelpText>
        <HxButton variant="secondary" style={{ marginTop: '1rem' }} onHxClick={() => reset()}>
          Register another patient
        </HxButton>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {/* First name */}
      <Controller
        name="firstName"
        control={control}
        render={({ field }: { field: ControllerRenderProps<PatientFormValues, 'firstName'> }) => (
          <div>
            <HxTextInput
              label="First Name"
              name={field.name}
              value={field.value}
              required
              error={errors.firstName?.message}
              // onHxInput fires on every keystroke — wire to RHF onChange for live validation
              onHxInput={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
              onHxChange={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
            />
          </div>
        )}
      />

      {/* Last name */}
      <Controller
        name="lastName"
        control={control}
        render={({ field }: { field: ControllerRenderProps<PatientFormValues, 'lastName'> }) => (
          <div>
            <HxTextInput
              label="Last Name"
              name={field.name}
              value={field.value}
              required
              error={errors.lastName?.message}
              onHxInput={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
              onHxChange={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
            />
          </div>
        )}
      />

      {/* Email */}
      <Controller
        name="email"
        control={control}
        render={({ field }: { field: ControllerRenderProps<PatientFormValues, 'email'> }) => (
          <div>
            <HxTextInput
              label="Email Address"
              name={field.name}
              value={field.value}
              type="email"
              required
              autocomplete="email"
              error={errors.email?.message}
              onHxInput={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
              onHxChange={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
            />
          </div>
        )}
      />

      {/* Date of birth */}
      <Controller
        name="dateOfBirth"
        control={control}
        render={({ field }: { field: ControllerRenderProps<PatientFormValues, 'dateOfBirth'> }) => (
          <div>
            <HxTextInput
              label="Date of Birth"
              name={field.name}
              value={field.value}
              type="date"
              required
              error={errors.dateOfBirth?.message}
              onHxInput={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
              onHxChange={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.value);
              }}
            />
          </div>
        )}
      />

      {/* Preferred contact method */}
      <Controller
        name="preferredContact"
        control={control}
        render={({
          field,
        }: {
          field: ControllerRenderProps<PatientFormValues, 'preferredContact'>;
        }) => (
          <div>
            {/*
             * HxSelect children are hx-option elements (web components).
             * Pass them as slotted content via children prop.
             * onHxChange fires with a CustomEvent; the selected value is on event.target.
             */}
            <HxSelect
              label="Preferred Contact Method"
              name={field.name}
              value={field.value}
              required
              error={errors.preferredContact?.message}
              onHxChange={(event: Event) => {
                const target = event.target as HTMLSelectElement;
                field.onChange(target.value);
              }}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="sms">SMS / Text</option>
              <option value="portal">Patient Portal</option>
            </HxSelect>
          </div>
        )}
      />

      {/* Consent checkbox */}
      <Controller
        name="consent"
        control={control}
        render={({ field }: { field: ControllerRenderProps<PatientFormValues, 'consent'> }) => (
          <div>
            <HxCheckbox
              label="I consent to receiving care and agree to the terms of service"
              name={field.name}
              checked={field.value}
              required
              error={errors.consent?.message}
              // onHxChange fires when the checkbox is toggled
              onHxChange={(event: Event) => {
                const target = event.target as HTMLInputElement;
                field.onChange(target.checked);
              }}
            />
          </div>
        )}
      />

      {/* Submit */}
      <HxButton
        type="submit"
        variant="primary"
        loading={isSubmitting}
        style={{ marginTop: '0.5rem' }}
      >
        Submit Registration
      </HxButton>
    </form>
  );
}
