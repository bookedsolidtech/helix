'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixContainer } from '@helix/library/components/hx-container';

export const HxContainer = createComponent({
  react: React,
  tagName: 'hx-container',
  elementClass: HelixContainer,
  events: {},
});
