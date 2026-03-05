'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixTextInput } from '@helix/library/components/hx-text-input';

export const HxTextInput = createComponent({
  react: React,
  tagName: 'hx-text-input',
  elementClass: HelixTextInput,
  events: {
    onHxInput: 'hx-input',
    onHxChange: 'hx-change',
  },
});
