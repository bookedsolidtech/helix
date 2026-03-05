'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixSlider } from '@helix/library/components/hx-slider';

export const HxSlider = createComponent({
  react: React,
  tagName: 'hx-slider',
  elementClass: HelixSlider,
  events: {
    onHxInput: 'hx-input',
    onHxChange: 'hx-change',
  },
});
