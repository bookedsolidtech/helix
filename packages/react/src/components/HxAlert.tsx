'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixAlert } from '@helix/library/components/hx-alert';

export const HxAlert = createComponent({
  react: React,
  tagName: 'hx-alert',
  elementClass: HelixAlert,
  events: {
    onHxDismiss: 'hx-dismiss',
    onHxAfterDismiss: 'hx-after-dismiss',
  },
});
