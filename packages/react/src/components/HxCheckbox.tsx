'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixCheckbox } from '@helix/library/components/hx-checkbox';

export const HxCheckbox = createComponent({
  react: React,
  tagName: 'hx-checkbox',
  elementClass: HelixCheckbox,
  events: {
    onHxChange: 'hx-change',
  },
});
