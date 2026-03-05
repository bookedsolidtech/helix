'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixIconButton } from '@helix/library/components/hx-icon-button';

export const HxIconButton = createComponent({
  react: React,
  tagName: 'hx-icon-button',
  elementClass: HelixIconButton,
  events: {
    onHxClick: 'hx-click',
  },
});
