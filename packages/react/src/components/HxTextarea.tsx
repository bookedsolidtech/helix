'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixTextarea } from '@helix/library/components/hx-textarea';

export const HxTextarea = createComponent({
  react: React,
  tagName: 'hx-textarea',
  elementClass: HelixTextarea,
  events: {
    onHxInput: 'hx-input',
    onHxChange: 'hx-change',
  },
});
