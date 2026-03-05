'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { HelixBreadcrumbItem } from '@helix/library/components/hx-breadcrumb';

export const HxBreadcrumbItem = createComponent({
  react: React,
  tagName: 'hx-breadcrumb-item',
  elementClass: HelixBreadcrumbItem,
  events: {},
});
