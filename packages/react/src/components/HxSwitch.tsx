'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixSwitch } from '@helix/library/components/hx-switch';

export const HxSwitch = createComponent({
  react: React,
  tagName: 'hx-switch',
  elementClass: HelixSwitch,
  events: {
    onHxChange: 'hx-change',
  },
});
