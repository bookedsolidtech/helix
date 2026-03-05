'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixBadge } from '@helix/library/components/hx-badge';

export const HxBadge = createComponent({
  react: React,
  tagName: 'hx-badge',
  elementClass: HelixBadge,
  events: {
    onHxRemove: 'hx-remove',
  },
});
