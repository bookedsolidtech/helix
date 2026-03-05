'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixButtonGroup } from '@helix/library/components/hx-button-group';

export const HxButtonGroup = createComponent({
  react: React,
  tagName: 'hx-button-group',
  elementClass: HelixButtonGroup,
  events: {},
});
