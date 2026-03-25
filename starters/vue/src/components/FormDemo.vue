<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { HxClickDetail, HxInputDetail } from '../helix.d.ts';

interface FormState {
  name: string;
  email: string;
  phone: string;
}

const form = reactive<FormState>({ name: '', email: '', phone: '' });
const submitted = ref(false);

function handleInput(field: keyof FormState) {
  return (e: CustomEvent<HxInputDetail>) => {
    form[field] = e.detail.value;
  };
}

function handleSubmit(_e: CustomEvent<HxClickDetail>) {
  submitted.value = true;
  setTimeout(() => (submitted.value = false), 3000);
}
</script>

<template>
  <section style="margin-bottom: 2rem">
    <h2>Form Demo</h2>
    <p>Text inputs with typed <code>hx-input</code> events and reactive state binding.</p>

    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px">
      <hx-text-input
        label="Full name"
        placeholder="Jane Doe"
        :value="form.name"
        required
        @hx-input="handleInput('name')"
      />

      <hx-text-input
        label="Email address"
        type="email"
        placeholder="jane@example.com"
        :value="form.email"
        required
        help-text="We will never share your email."
        @hx-input="handleInput('email')"
      />

      <hx-text-input
        label="Phone number"
        type="tel"
        placeholder="(555) 123-4567"
        :value="form.phone"
        pattern="[0-9()+\-\s]+"
        help-text="Optional. Digits, parentheses, dashes, and spaces only."
        @hx-input="handleInput('phone')"
      />

      <hx-text-input label="Read-only field" value="This value cannot be changed" readonly />

      <hx-text-input
        label="Error state"
        value="bad-email"
        type="email"
        error="Please enter a valid email address."
      />

      <div style="display: flex; gap: 0.5rem; align-items: center">
        <hx-button variant="primary" @hx-click="handleSubmit">Submit</hx-button>
        <span v-if="submitted" style="color: green">
          Submitted: {{ form.name }}, {{ form.email }}
        </span>
      </div>
    </div>
  </section>
</template>
