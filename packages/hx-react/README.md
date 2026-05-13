# @helixui/react

React wrappers for the HELiX web component library. Auto-generated from `custom-elements.json` using [`@lit/react`](https://lit.dev/docs/frameworks/react/) `createComponent()`. The exact wrapper inventory is the union of CEM declarations and the generator's allow-list; see [Available Components](#available-components) below for the current list.

## Installation

```bash
npm install @helixui/react @helixui/library
# or
pnpm add @helixui/react @helixui/library
```

**Peer dependencies:** `react >= 18.0.0`, `react-dom >= 18.0.0`

## Usage

```tsx
import { HxButton, HxTextInput, HxDialog } from '@helixui/react';

function MyForm() {
  return (
    <form>
      <HxTextInput label="Name" onHxInput={(e) => console.log(e)} />
      <HxButton variant="primary" onHxClick={() => console.log('clicked')}>
        Submit
      </HxButton>
    </form>
  );
}
```

## Event Binding

Custom events are mapped to React-style callback props with the `onHx` prefix:

| Web component event | React prop   |
| ------------------- | ------------ |
| `hx-click`          | `onHxClick`  |
| `hx-input`          | `onHxInput`  |
| `hx-change`         | `onHxChange` |
| `hx-open`           | `onHxOpen`   |
| `hx-close`          | `onHxClose`  |

The `onHx*` prefix avoids collision with native React synthetic events (`onChange`, `onClick`).

## Next.js 15 App Router (SSR)

All wrappers include `'use client'` as the first line, making them compatible with Next.js 15 App Router. No additional configuration is needed.

```tsx
// app/page.tsx (Server Component) — import is fine
import { HxButton } from '@helixui/react';

// HxButton automatically runs as a Client Component due to 'use client'
export default function Page() {
  return <HxButton>Click me</HxButton>;
}
```

## Tree-Shaking

Each component is a separate entry point. Importing `HxButton` does not bundle every component:

```tsx
// Only HxButton is included in your bundle
import { HxButton } from '@helixui/react';

// Or use the direct component path for explicit splitting
import { HxButton } from '@helixui/react/components/HxButton';
```

## TypeScript

All prop types are derived from CEM (`custom-elements.json`) declarations. Props and refs are fully typed; **event callback names** (`onHxClick`, `onHxInput`, etc.) are typed, but their payloads are currently surfaced as `Event` — CEM-specific `CustomEvent<DetailType>` payload typing is queued for the next generator pass:

```tsx
import { HxButton, type HxButtonProps } from '@helixui/react';

const props: HxButtonProps = {
  variant: 'primary', // 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'
  size: 'md', // 'sm' | 'md' | 'lg'
  disabled: false,
  onHxClick: (e) => {},
};
```

## Regenerating Wrappers

Wrappers are auto-generated from `packages/hx-library/custom-elements.json`. If the CEM changes (new component, new prop, new event), regenerate:

```bash
pnpm --filter=@helixui/react run generate
```

This runs `scripts/generate-react-wrappers.ts` which reads the CEM and writes all wrapper files to `src/components/`.

## Available Components

The current generated wrapper set (96 wrappers, regenerated from `packages/hx-react/src/index.ts`):

`HxAccordion`, `HxAccordionItem`, `HxActionBar`, `HxAlert`, `HxAvatar`, `HxBadge`, `HxBanner`, `HxBreadcrumb`, `HxButton`, `HxButtonGroup`, `HxCard`, `HxCarousel`, `HxCarouselItem`, `HxCheckbox`, `HxCheckboxGroup`, `HxCodeSnippet`, `HxColorPicker`, `HxCombobox`, `HxContainer`, `HxCopyButton`, `HxCounter`, `HxDataTable`, `HxDatePicker`, `HxDialog`, `HxDivider`, `HxDrawer`, `HxDropdown`, `HxField`, `HxFieldLabel`, `HxFileUpload`, `HxForm`, `HxFormatDate`, `HxGrid`, `HxGridItem`, `HxHelpText`, `HxIcon`, `HxIconButton`, `HxImage`, `HxLink`, `HxList`, `HxListItem`, `HxMenu`, `HxMenuDivider`, `HxMenuItem`, `HxMeter`, `HxNav`, `HxNavItem`, `HxNumberInput`, `HxOverflowMenu`, `HxPagination`, `HxPatientBanner`, `HxPhiField`, `HxPopover`, `HxPopup`, `HxProgressBar`, `HxProgressRing`, `HxProse`, `HxRadio`, `HxRadioGroup`, `HxRating`, `HxSelect`, `HxSideNav`, `HxSkeleton`, `HxSlider`, `HxSpinner`, `HxSplitButton`, `HxSplitPanel`, `HxStack`, `HxStat`, `HxStep`, `HxSteps`, `HxStyleScope`, `HxSwitch`, `HxTab`, `HxTable`, `HxTabPanel`, `HxTabs`, `HxTag`, `HxTbody`, `HxTd`, `HxText`, `HxTextarea`, `HxTextInput`, `HxTfoot`, `HxTh`, `HxThead`, `HxTheme`, `HxTimePicker`, `HxToast`, `HxToastStack`, `HxToggleButton`, `HxTooltip`, `HxTopNav`, `HxTr`, `HxTreeItem`, `HxTreeView`

This list is generated from CEM + the allow-list; consult `packages/hx-react/src/index.ts` for the authoritative re-export block.
