'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixRadio } from '@helix/library/components/hx-radio-group';

export const HxRadio = createComponent({
  react: React,
  tagName: 'hx-radio',
  elementClass: HelixRadio,
  events: {},
});
