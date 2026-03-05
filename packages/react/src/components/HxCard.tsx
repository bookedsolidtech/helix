'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixCard } from '@helix/library/components/hx-card';

export const HxCard = createComponent({
  react: React,
  tagName: 'hx-card',
  elementClass: HelixCard,
  events: {
    onHxCardClick: 'hx-card-click',
    onWcCardClick: 'wc-card-click',
  },
});
