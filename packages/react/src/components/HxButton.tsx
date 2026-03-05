'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixButton } from '@helix/library/components/hx-button';

export const HxButton = createComponent({
  react: React,
  tagName: 'hx-button',
  elementClass: HelixButton,
  events: {
    onHxClick: 'hx-click',
  },
});
