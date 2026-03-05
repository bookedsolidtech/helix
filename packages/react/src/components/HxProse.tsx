'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixProse } from '@helix/library/components/hx-prose';

export const HxProse = createComponent({
  react: React,
  tagName: 'hx-prose',
  elementClass: HelixProse,
  events: {},
});
