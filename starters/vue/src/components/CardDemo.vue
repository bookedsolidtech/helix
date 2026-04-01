<script setup lang="ts">
const cards = [
  {
    title: 'Patient Records',
    description: 'View and manage patient health records securely within the enterprise portal.',
    variant: 'default' as const,
    elevation: 'raised' as const,
    badge: 'Active',
  },
  {
    title: 'Lab Results',
    description: 'Access laboratory results with HIPAA-compliant data handling.',
    variant: 'featured' as const,
    elevation: 'floating' as const,
    badge: 'New',
  },
  {
    title: 'Appointments',
    description: 'Schedule and manage patient appointments.',
    variant: 'compact' as const,
    elevation: 'flat' as const,
  },
] as const;
</script>

<template>
  <section style="margin-bottom: 2rem">
    <h2>Card Demo</h2>
    <p>Card variants with badges, elevation levels, and slot composition.</p>

    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem"
    >
      <hx-card
        v-for="card in cards"
        :key="card.title"
        :variant="card.variant"
        :elevation="card.elevation"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start">
          <h3 style="margin: 0">{{ card.title }}</h3>
          <hx-badge v-if="card.badge">{{ card.badge }}</hx-badge>
        </div>
        <p>{{ card.description }}</p>
      </hx-card>
    </div>

    <h3>Interactive card (with link)</h3>
    <hx-card
      variant="default"
      elevation="raised"
      href="https://github.com/bookedsolidtech/helix"
      label="Visit HELiX repository on GitHub"
    >
      <h3 style="margin: 0">HELiX on GitHub</h3>
      <p>Click this card to visit the repository.</p>
    </hx-card>
  </section>
</template>
