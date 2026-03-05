'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixForm } from '@helix/library/components/hx-form';

export const HxForm = createComponent({
  react: React,
  tagName: 'hx-form',
  elementClass: HelixForm,
  events: {
    onWcSubmit: 'wc-submit',
    onWcInvalid: 'wc-invalid',
    onWcReset: 'wc-reset',
  },
});
