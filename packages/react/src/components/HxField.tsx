'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixField } from '@helix/library/components/hx-field';

export const HxField = createComponent({
  react: React,
  tagName: 'hx-field',
  elementClass: HelixField,
  events: {},
});
