'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixSelect } from '@helix/library/components/hx-select';

export const HxSelect = createComponent({
  react: React,
  tagName: 'hx-select',
  elementClass: HelixSelect,
  events: {
    onHxChange: 'hx-change',
    onHxInput: 'hx-input',
  },
});
