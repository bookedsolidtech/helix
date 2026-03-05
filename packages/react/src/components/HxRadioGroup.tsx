'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixRadioGroup } from '@helix/library/components/hx-radio-group';

export const HxRadioGroup = createComponent({
  react: React,
  tagName: 'hx-radio-group',
  elementClass: HelixRadioGroup,
  events: {
    onHxChange: 'hx-change',
  },
});
