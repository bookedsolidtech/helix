'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixAvatar } from '@helix/library/components/hx-avatar';

export const HxAvatar = createComponent({
  react: React,
  tagName: 'hx-avatar',
  elementClass: HelixAvatar,
  events: {},
});
