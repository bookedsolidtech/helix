'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixBreadcrumb } from '@helix/library/components/hx-breadcrumb';

export const HxBreadcrumb = createComponent({
  react: React,
  tagName: 'hx-breadcrumb',
  elementClass: HelixBreadcrumb,
  events: {},
});
