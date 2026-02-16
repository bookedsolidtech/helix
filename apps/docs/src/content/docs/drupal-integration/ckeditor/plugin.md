---
title: CKEditor Plugin Development
description: Comprehensive guide to building CKEditor 5 plugins for HELIX web components in Drupal 10 and 11
order: 39
---

Building custom CKEditor 5 plugins enables content editors to insert and configure HELIX web components directly within the rich text editor. This deep dive covers plugin architecture, widget creation, command implementation, and complete integration patterns for Drupal 10 and 11.

## CKEditor 5 Architecture Overview

CKEditor 5 introduced a fundamental architectural shift from CKEditor 4. Understanding this architecture is critical for plugin development.

### Model-View-Controller Pattern

CKEditor 5 uses a strict MVC pattern with three distinct layers:

**Model** - The editor's data representation. This is the source of truth for content state. The model uses a custom tree structure optimized for collaborative editing operations.

**View** - Two separate views exist:

- **Editing View** - What users see and interact with in the editor UI
- **Data View** - The HTML output when content is saved

**Controller** - Conversion layer that transforms model changes into view updates and vice versa through upcast (HTML → model) and downcast (model → view) conversions.

### Plugin System

Every feature in CKEditor 5 is a plugin. Core features like bold text, lists, and images are plugins. Your custom web component insertion functionality is also a plugin.

Plugins follow a modular pattern:

```javascript
// Entry point plugin
export default class HxCard extends Plugin {
  static get requires() {
    return [HxCardEditing, HxCardUI];
  }

  static get pluginName() {
    return 'HxCard';
  }
}
```

This pattern separates concerns:

- **Editing plugin** - Handles model schema, conversion, and commands
- **UI plugin** - Provides toolbar buttons, dialogs, and user interaction
- **Entry point** - Combines editing and UI, declares dependencies

### Why This Matters for HELIX

HELIX web components are custom HTML elements with Shadow DOM encapsulation. CKEditor 5 doesn't natively understand these elements. We need plugins that:

1. Define model schema for component representation
2. Convert component HTML to model elements (upcast)
3. Convert model elements back to component HTML (downcast)
4. Provide UI for component insertion and configuration
5. Enable inline editing of component properties

## Plugin Architecture for Web Components

Building a HELIX component plugin requires three core files plus supporting infrastructure.

### File Structure

```
modules/custom/hx_ckeditor/
├── js/
│   ├── ckeditor5_plugins/
│   │   └── hxCard/
│   │       ├── src/
│   │       │   ├── index.js              # Entry point
│   │       │   ├── hxcardediting.js      # Model & conversion
│   │       │   ├── hxcardui.js           # Toolbar & dialogs
│   │       │   ├── hxcardcommand.js      # Insert command
│   │       │   └── theme/
│   │       │       └── hxcard.css        # Editor-only styles
│   │       ├── package.json
│   │       └── webpack.config.js
│   └── build/
│       └── hxCard.js                     # Compiled output
├── hx_ckeditor.ckeditor5.yml             # Plugin declaration
└── hx_ckeditor.libraries.yml            # Drupal library
```

### Drupal Integration Files

**hx_ckeditor.ckeditor5.yml**

```yaml
hx_ckeditor_hxcard:
  ckeditor5:
    plugins:
      - hxCard.HxCard
  drupal:
    label: HX Card
    library: hx_ckeditor/hxcard
    admin_library: hx_ckeditor/hxcard.admin
    elements:
      - <hx-card>
      - <span slot="heading">
      - <div slot="media">
      - <div slot="actions">
      - <div slot="footer">
```

**hx_ckeditor.libraries.yml**

```yaml
hxcard:
  js:
    js/build/hxCard.js:
      attributes:
        type: module
  dependencies:
    - core/ckeditor5

hxcard.admin:
  js:
    js/admin/hxcard-admin.js: {}
  dependencies:
    - core/drupal
    - core/once
```

## Creating the Editing Plugin

The editing plugin defines how HELIX components exist in the editor's model and how they convert to/from HTML.

### Model Schema Definition

```javascript
// hxcardediting.js
import { Plugin } from 'ckeditor5/src/core';
import { Widget, toWidget, toWidgetEditable } from 'ckeditor5/src/widget';

export default class HxCardEditing extends Plugin {
  static get requires() {
    return [Widget];
  }

  init() {
    this._defineSchema();
    this._defineConverters();
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    // Define hxCard as a block element
    schema.register('hxCard', {
      inheritAllFrom: '$blockObject',
      allowAttributes: ['variant', 'elevation', 'href', 'target'],
    });

    // Define slotted content areas
    schema.register('hxCardHeading', {
      allowIn: 'hxCard',
      allowContentOf: '$block',
      isLimit: true,
    });

    schema.register('hxCardMedia', {
      allowIn: 'hxCard',
      allowContentOf: '$root',
      isLimit: true,
    });

    schema.register('hxCardContent', {
      allowIn: 'hxCard',
      allowContentOf: '$root',
      isLimit: true,
    });

    schema.register('hxCardActions', {
      allowIn: 'hxCard',
      allowContentOf: '$block',
      isLimit: true,
    });

    schema.register('hxCardFooter', {
      allowIn: 'hxCard',
      allowContentOf: '$block',
      isLimit: true,
    });
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

    // Upcast: HTML → Model
    conversion.for('upcast').elementToElement({
      view: {
        name: 'hx-card',
      },
      model: (viewElement, { writer: modelWriter }) => {
        return modelWriter.createElement('hxCard', {
          variant: viewElement.getAttribute('variant') || 'default',
          elevation: viewElement.getAttribute('elevation') || 'flat',
          href: viewElement.getAttribute('href') || '',
          target: viewElement.getAttribute('target') || '',
        });
      },
    });

    // Upcast slots
    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        attributes: {
          slot: 'heading',
        },
      },
      model: 'hxCardHeading',
    });

    conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        attributes: {
          slot: 'media',
        },
      },
      model: 'hxCardMedia',
    });

    conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        attributes: {
          slot: 'actions',
        },
      },
      model: 'hxCardActions',
    });

    conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        attributes: {
          slot: 'footer',
        },
      },
      model: 'hxCardFooter',
    });

    // Downcast: Model → Data View (saved HTML)
    conversion.for('dataDowncast').elementToElement({
      model: 'hxCard',
      view: (modelElement, { writer: viewWriter }) => {
        return viewWriter.createContainerElement('hx-card', {
          variant: modelElement.getAttribute('variant'),
          elevation: modelElement.getAttribute('elevation'),
          href: modelElement.getAttribute('href') || null,
          target: modelElement.getAttribute('target') || null,
        });
      },
    });

    // Downcast slots to data view
    conversion.for('dataDowncast').elementToElement({
      model: 'hxCardHeading',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('span', {
          slot: 'heading',
        });
      },
    });

    conversion.for('dataDowncast').elementToElement({
      model: 'hxCardMedia',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('div', {
          slot: 'media',
        });
      },
    });

    conversion.for('dataDowncast').elementToElement({
      model: 'hxCardActions',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('div', {
          slot: 'actions',
        });
      },
    });

    conversion.for('dataDowncast').elementToElement({
      model: 'hxCardFooter',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('div', {
          slot: 'footer',
        });
      },
    });

    // Downcast: Model → Editing View (in editor UI)
    conversion.for('editingDowncast').elementToElement({
      model: 'hxCard',
      view: (modelElement, { writer: viewWriter }) => {
        const section = viewWriter.createContainerElement('section', {
          class: 'hx-card-widget',
          'data-variant': modelElement.getAttribute('variant'),
          'data-elevation': modelElement.getAttribute('elevation'),
        });

        return toWidget(section, viewWriter, {
          label: 'HX Card widget',
        });
      },
    });

    // Editable slots in editing view
    conversion.for('editingDowncast').elementToElement({
      model: 'hxCardHeading',
      view: (modelElement, { writer: viewWriter }) => {
        const heading = viewWriter.createEditableElement('div', {
          class: 'hx-card-widget__heading',
        });
        return toWidgetEditable(heading, viewWriter);
      },
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'hxCardMedia',
      view: (modelElement, { writer: viewWriter }) => {
        const media = viewWriter.createEditableElement('div', {
          class: 'hx-card-widget__media',
        });
        return toWidgetEditable(media, viewWriter);
      },
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'hxCardContent',
      view: (modelElement, { writer: viewWriter }) => {
        const content = viewWriter.createEditableElement('div', {
          class: 'hx-card-widget__content',
        });
        return toWidgetEditable(content, viewWriter);
      },
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'hxCardActions',
      view: (modelElement, { writer: viewWriter }) => {
        const actions = viewWriter.createEditableElement('div', {
          class: 'hx-card-widget__actions',
        });
        return toWidgetEditable(actions, viewWriter);
      },
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'hxCardFooter',
      view: (modelElement, { writer: viewWriter }) => {
        const footer = viewWriter.createEditableElement('div', {
          class: 'hx-card-widget__footer',
        });
        return toWidgetEditable(footer, viewWriter);
      },
    });
  }
}
```

### Key Concepts in Schema and Conversion

**inheritAllFrom: '$blockObject'** - Makes hxCard behave like other block elements (paragraphs, headings). It can be inserted at the document root and selected as a unit.

**isLimit: true** - Slot containers are "limit" elements. Users can edit content inside them, but selection can't escape the boundary. This prevents accidentally merging card content with surrounding paragraphs.

**toWidget()** - Transforms a view element into a CKEditor widget. Widgets have selection handles, can be deleted as a unit, and provide visual distinction in the editor.

**toWidgetEditable()** - Creates an editable region within a widget. Users can click into these areas and type normally.

**Separate Downcast Conversions** - Data downcast produces `<hx-card>` with actual component markup. Editing downcast produces `<section class="hx-card-widget">` with placeholder styling for the editor UI.

## Creating the Command

Commands execute actions like inserting components. They're invoked by toolbar buttons, keyboard shortcuts, or programmatically.

```javascript
// hxcardcommand.js
import { Command } from 'ckeditor5/src/core';

export default class HxCardCommand extends Command {
  execute(options = {}) {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change((writer) => {
      // Create the card element
      const hxCard = writer.createElement('hxCard', {
        variant: options.variant || 'default',
        elevation: options.elevation || 'flat',
        href: options.href || '',
        target: options.target || '',
      });

      // Create slot containers
      const heading = writer.createElement('hxCardHeading');
      const media = writer.createElement('hxCardMedia');
      const content = writer.createElement('hxCardContent');
      const actions = writer.createElement('hxCardActions');
      const footer = writer.createElement('hxCardFooter');

      // Add placeholder content
      writer.appendElement('paragraph', heading);
      writer.insertText('Card Heading', heading.getChild(0), 0);

      writer.appendElement('paragraph', content);
      writer.insertText('Card content goes here...', content.getChild(0), 0);

      // Append slots to card
      writer.append(heading, hxCard);
      writer.append(media, hxCard);
      writer.append(content, hxCard);
      writer.append(actions, hxCard);
      writer.append(footer, hxCard);

      // Insert card at current position
      model.insertContent(hxCard, selection);

      // Set selection inside heading for immediate editing
      writer.setSelection(heading, 'in');
    });
  }

  refresh() {
    const model = this.editor.model;
    const selection = model.document.selection;
    const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'hxCard');

    this.isEnabled = allowedIn !== null;
  }
}
```

### Command Lifecycle

**execute(options)** - Performs the insertion. Receives optional configuration from UI dialogs.

**refresh()** - Called automatically when selection changes. Updates `this.isEnabled` based on whether the card can be inserted at the current position. The toolbar button automatically disables when the command is disabled.

**Model.change(writer => {})** - All model modifications happen within change blocks. The writer provides methods for creating elements, setting attributes, and manipulating the document tree.

## Creating the UI Plugin

The UI plugin adds toolbar buttons and dialogs for component insertion and configuration.

```javascript
// hxcardui.js
import { Plugin } from 'ckeditor5/src/core';
import { ButtonView } from 'ckeditor5/src/ui';
import { ContextualBalloon } from 'ckeditor5/src/ui';
import HxCardFormView from './ui/hxcardformview';

import cardIcon from '../theme/icons/card.svg';

export default class HxCardUI extends Plugin {
  static get requires() {
    return [ContextualBalloon];
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

    // Add toolbar button
    editor.ui.componentFactory.add('hxCard', (locale) => {
      const command = editor.commands.get('insertHxCard');
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: t('Insert Card'),
        icon: cardIcon,
        tooltip: true,
      });

      // Bind button state to command state
      buttonView.bind('isEnabled').to(command, 'isEnabled');

      // Execute command when clicked
      buttonView.on('execute', () => {
        this._showUI();
      });

      return buttonView;
    });
  }

  _showUI() {
    const editor = this.editor;
    const balloon = this.editor.plugins.get(ContextualBalloon);

    // Create form view if it doesn't exist
    if (!this.formView) {
      this._createFormView();
    }

    // Show balloon panel with form
    balloon.add({
      view: this.formView,
      position: this._getBalloonPositionData(),
    });

    this.formView.focus();
  }

  _hideUI() {
    const balloon = this.editor.plugins.get(ContextualBalloon);

    this.formView.variantInputView.fieldView.value = '';
    this.formView.elevationInputView.fieldView.value = '';
    this.formView.hrefInputView.fieldView.value = '';

    this.formView.element.reset();

    balloon.remove(this.formView);
    this.editor.editing.view.focus();
  }

  _createFormView() {
    const editor = this.editor;
    const formView = new HxCardFormView(editor.locale);

    // Submit form
    this.listenTo(formView, 'submit', () => {
      const values = {
        variant: formView.variantInputView.fieldView.value,
        elevation: formView.elevationInputView.fieldView.value,
        href: formView.hrefInputView.fieldView.value,
        target: formView.targetInputView.fieldView.value,
      };

      editor.execute('insertHxCard', values);
      this._hideUI();
    });

    // Cancel form
    this.listenTo(formView, 'cancel', () => {
      this._hideUI();
    });

    this.formView = formView;
  }

  _getBalloonPositionData() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;
    const target = view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange());

    return {
      target,
    };
  }
}
```

### Contextual Balloon Pattern

The ContextualBalloon plugin provides a floating panel positioned near the selection. This is the standard CKEditor 5 pattern for configuration dialogs.

**Why not a modal?** - Contextual balloons keep users in the editing context. They can see their content while configuring the component.

**Form View Separation** - The `HxCardFormView` is a separate class that defines the form UI. This follows CKEditor's separation of concerns.

## Creating the Form View

Form views define configuration dialogs with inputs, labels, and validation.

```javascript
// ui/hxcardformview.js
import {
  View,
  LabeledFieldView,
  createLabeledInputText,
  createLabeledDropdown,
  ButtonView,
  submitHandler,
} from 'ckeditor5/src/ui';
import { Collection } from 'ckeditor5/src/utils';

export default class HxCardFormView extends View {
  constructor(locale) {
    super(locale);

    const t = locale.t;

    // Variant dropdown
    this.variantInputView = this._createDropdown(t('Variant'), [
      { label: 'Default', value: 'default' },
      { label: 'Featured', value: 'featured' },
      { label: 'Compact', value: 'compact' },
    ]);

    // Elevation dropdown
    this.elevationInputView = this._createDropdown(t('Elevation'), [
      { label: 'Flat', value: 'flat' },
      { label: 'Raised', value: 'raised' },
      { label: 'Floating', value: 'floating' },
    ]);

    // URL input
    this.hrefInputView = this._createInput(t('Link URL'));
    this.hrefInputView.fieldView.placeholder = 'https://example.com';

    // Target dropdown
    this.targetInputView = this._createDropdown(t('Link Target'), [
      { label: 'Same Window', value: '' },
      { label: 'New Window', value: '_blank' },
      { label: 'Parent Frame', value: '_parent' },
    ]);

    // Submit button
    this.saveButtonView = this._createButton(t('Insert Card'), null, 'ck-button-save');
    this.saveButtonView.type = 'submit';

    // Cancel button
    this.cancelButtonView = this._createButton(t('Cancel'), null, 'ck-button-cancel');

    // Build template
    this.setTemplate({
      tag: 'form',
      attributes: {
        class: ['ck', 'hx-card-form'],
        tabindex: '-1',
      },
      children: [
        this.variantInputView,
        this.elevationInputView,
        this.hrefInputView,
        this.targetInputView,
        this.saveButtonView,
        this.cancelButtonView,
      ],
    });
  }

  render() {
    super.render();

    // Enable form submission
    submitHandler({
      view: this,
    });

    // Cancel button handler
    this.cancelButtonView.on('execute', () => {
      this.fire('cancel');
    });
  }

  focus() {
    this.variantInputView.focus();
  }

  _createInput(label) {
    const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);

    labeledInput.label = label;

    return labeledInput;
  }

  _createDropdown(label, options) {
    const locale = this.locale;
    const t = locale.t;

    const labeledDropdown = new LabeledFieldView(locale, createLabeledDropdown);

    labeledDropdown.label = label;

    const items = new Collection();

    options.forEach((option) => {
      items.add({
        type: 'button',
        model: {
          withText: true,
          label: option.label,
          value: option.value,
        },
      });
    });

    labeledDropdown.fieldView.buttonView.set({
      isOn: false,
      withText: true,
      label: options[0].label,
    });

    labeledDropdown.fieldView.on('execute', (evt) => {
      labeledDropdown.fieldView.buttonView.label = evt.source.label;
      labeledDropdown.fieldView.value = evt.source.value;
    });

    labeledDropdown.fieldView.panelView.children.add(new Collection(items));

    return labeledDropdown;
  }

  _createButton(label, icon, className) {
    const button = new ButtonView();

    button.set({
      label,
      icon,
      tooltip: true,
      class: className,
    });

    return button;
  }
}
```

### Form View Patterns

**LabeledFieldView** - Wraps inputs with accessible labels and help text.

**createLabeledInputText** - Factory function that creates standard text inputs.

**Custom Dropdown** - CKEditor 5 doesn't have a native select dropdown. We create one using ButtonView + Collection.

**submitHandler** - Utility that makes the form submit on Enter key and prevents default browser form submission.

## Widget Styling for the Editor

Components render in Shadow DOM on the frontend, but in the editor they're placeholder widgets. We need CSS to make them recognizable.

```css
/* theme/hxcard.css */
.hx-card-widget {
  border: 2px solid var(--ck-color-widget-blurred-border);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background: var(--ck-color-base-background);
  position: relative;
}

.hx-card-widget::before {
  content: 'HX Card (' attr(data-variant) ')';
  display: block;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  color: var(--ck-color-base-text);
  opacity: 0.6;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.hx-card-widget[data-variant='featured'] {
  border-color: var(--ck-color-focus-border);
  background: var(--ck-color-panel-background);
}

.hx-card-widget[data-elevation='raised'] {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hx-card-widget[data-elevation='floating'] {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hx-card-widget__heading {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.hx-card-widget__heading::before {
  content: 'Heading: ';
  font-size: 10px;
  font-weight: normal;
  opacity: 0.5;
  text-transform: uppercase;
}

.hx-card-widget__media {
  min-height: 100px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0, 0, 0, 0.05) 10px,
    rgba(0, 0, 0, 0.05) 20px
  );
  border: 1px dashed var(--ck-color-widget-blurred-border);
  border-radius: 4px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hx-card-widget__media::before {
  content: 'Media Slot';
  font-size: 12px;
  color: var(--ck-color-base-text);
  opacity: 0.4;
}

.hx-card-widget__content {
  min-height: 60px;
  padding: 8px;
  margin-bottom: 12px;
}

.hx-card-widget__actions {
  padding: 8px;
  border-top: 1px solid var(--ck-color-base-border);
  margin-top: 12px;
  min-height: 40px;
}

.hx-card-widget__actions::before {
  content: 'Actions: ';
  font-size: 10px;
  opacity: 0.5;
  text-transform: uppercase;
}

.hx-card-widget__footer {
  padding: 8px;
  font-size: 12px;
  color: var(--ck-color-base-text);
  opacity: 0.8;
  border-top: 1px solid var(--ck-color-base-border);
  margin-top: 8px;
}

.ck-widget_selected .hx-card-widget {
  border-color: var(--ck-color-focus-border);
  box-shadow: 0 0 0 2px var(--ck-color-focus-outer-shadow);
}
```

### Styling Principles

**Use CKEditor Variables** - CKEditor 5 provides CSS custom properties for theming. Using them ensures your widget matches the editor's color scheme.

**Visual Distinction** - Widgets should look different from regular content. Borders, labels, and placeholder patterns help editors understand they're working with a component.

**Slot Visualization** - Empty slots show placeholder text and patterns. This guides editors to fill in the expected content.

**Selection States** - CKEditor adds `.ck-widget_selected` when a widget is selected. Use this to provide visual feedback.

## Complete Entry Point

The main plugin file combines editing and UI plugins.

```javascript
// index.js
import { Plugin } from 'ckeditor5/src/core';
import HxCardEditing from './hxcardediting';
import HxCardUI from './hxcardui';
import HxCardCommand from './hxcardcommand';

import './theme/hxcard.css';

export default class HxCard extends Plugin {
  static get requires() {
    return [HxCardEditing, HxCardUI];
  }

  static get pluginName() {
    return 'HxCard';
  }

  init() {
    const editor = this.editor;

    // Register command
    editor.commands.add('insertHxCard', new HxCardCommand(editor));
  }
}
```

## Building the Plugin with Webpack

CKEditor 5 plugins must be compiled with Webpack using DLL mode.

```javascript
// webpack.config.js
const path = require('path');
const { CKEditorTranslationsPlugin } = require('@ckeditor/ckeditor5-dev-translations');
const { styles } = require('@ckeditor/ckeditor5-dev-utils');

module.exports = {
  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, '../../build'),
    filename: 'hxCard.js',
    library: ['CKEditor5', 'hxCard'],
    libraryTarget: 'umd',
    libraryExport: 'default',
  },

  module: {
    rules: [
      {
        test: /\.svg$/,
        use: ['raw-loader'],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              injectType: 'singletonStyleTag',
              attributes: {
                'data-cke': true,
              },
            },
          },
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: styles.getPostCssConfig({
                themeImporter: {
                  themePath: require.resolve('@ckeditor/ckeditor5-theme-lark'),
                },
                minify: true,
              }),
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new CKEditorTranslationsPlugin({
      language: 'en',
      additionalLanguages: 'all',
    }),
  ],

  externals: {
    'ckeditor5/src/core': 'CKEditor5.core',
    'ckeditor5/src/ui': 'CKEditor5.ui',
    'ckeditor5/src/widget': 'CKEditor5.widget',
    'ckeditor5/src/utils': 'CKEditor5.utils',
  },
};
```

### Build Configuration Key Points

**DLL Mode** - The `externals` section tells Webpack not to bundle CKEditor core. Instead, the plugin expects CKEditor to be loaded separately and accesses it as a global.

**SVG Loader** - Icon files are loaded as raw strings.

**CSS Processing** - PostCSS processes CKEditor's theme variables and minifies output.

**Translations** - CKEditorTranslationsPlugin enables multi-language support.

## Package.json Configuration

```json
{
  "name": "ckeditor5-hxcard",
  "version": "1.0.0",
  "description": "HX Card component plugin for CKEditor 5",
  "main": "src/index.js",
  "scripts": {
    "build": "webpack --mode production",
    "watch": "webpack --mode development --watch"
  },
  "dependencies": {
    "ckeditor5": "^43.0.0"
  },
  "devDependencies": {
    "@ckeditor/ckeditor5-dev-translations": "^43.0.0",
    "@ckeditor/ckeditor5-dev-utils": "^43.0.0",
    "@ckeditor/ckeditor5-theme-lark": "^43.0.0",
    "css-loader": "^6.8.1",
    "postcss-loader": "^7.3.3",
    "raw-loader": "^4.0.2",
    "style-loader": "^3.3.3",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.4"
  },
  "peerDependencies": {
    "ckeditor5": "^43.0.0"
  }
}
```

## Enabling the Plugin in Drupal

After building the plugin, enable it in Drupal's text format configuration.

### Via Admin UI

1. Navigate to **Configuration → Content Authoring → Text formats and editors**
2. Edit a text format (e.g., "Full HTML")
3. Under **CKEditor 5 plugin settings**, find **HX Card**
4. Check the box to enable
5. Drag the **Insert Card** button to the toolbar
6. Under **Allowed HTML tags**, add: `<hx-card> <span slot> <div slot>`
7. Save configuration

### Programmatic Configuration

```php
// config/sync/filter.format.full_html.yml
format: full_html
name: 'Full HTML'
weight: 1
filters: {}
editor:
  type: ckeditor5
  settings:
    plugins:
      - hxCard.HxCard
    toolbar:
      items:
        - heading
        - '|'
        - bold
        - italic
        - '|'
        - hxCard
        - '|'
        - link
        - drupalMedia
    allowed_html:
      allowed_tags:
        - '<hx-card variant elevation href target>'
        - '<span slot>'
        - '<div slot>'
        - '<hx-button variant hx-size type>'
```

## Advanced Patterns

### Editing Existing Components

To edit component properties after insertion, listen for widget selection and show a configuration balloon.

```javascript
// In HxCardUI plugin
_attachSelectionListener() {
  const editor = this.editor;
  const model = editor.model;
  const selection = model.document.selection;

  this.listenTo(selection, 'change:range', () => {
    const selectedElement = selection.getSelectedElement();

    if (selectedElement && selectedElement.name === 'hxCard') {
      this._showEditUI(selectedElement);
    }
  });
}

_showEditUI(modelElement) {
  const balloon = this.editor.plugins.get(ContextualBalloon);

  if (!this.editFormView) {
    this._createEditFormView();
  }

  // Populate form with current values
  this.editFormView.variantInputView.fieldView.value =
    modelElement.getAttribute('variant');
  this.editFormView.elevationInputView.fieldView.value =
    modelElement.getAttribute('elevation');
  this.editFormView.hrefInputView.fieldView.value =
    modelElement.getAttribute('href') || '';

  balloon.add({
    view: this.editFormView,
    position: this._getBalloonPositionData()
  });

  this._currentEditedElement = modelElement;
}

_updateElement() {
  const editor = this.editor;
  const model = editor.model;

  model.change(writer => {
    writer.setAttribute(
      'variant',
      this.editFormView.variantInputView.fieldView.value,
      this._currentEditedElement
    );
    writer.setAttribute(
      'elevation',
      this.editFormView.elevationInputView.fieldView.value,
      this._currentEditedElement
    );
    writer.setAttribute(
      'href',
      this.editFormView.hrefInputView.fieldView.value,
      this._currentEditedElement
    );
  });

  this._hideEditUI();
}
```

### Validating Component Insertion

Prevent insertion in invalid contexts (e.g., inside links or other components).

```javascript
// In HxCardCommand
refresh() {
  const model = this.editor.model;
  const selection = model.document.selection;
  const position = selection.getFirstPosition();

  // Check if inside a link
  const linkElement = position.findAncestor('linkElement');
  if (linkElement) {
    this.isEnabled = false;
    return;
  }

  // Check if inside another hxCard
  const parentCard = position.findAncestor('hxCard');
  if (parentCard) {
    this.isEnabled = false;
    return;
  }

  // Standard check
  const allowedIn = model.schema.findAllowedParent(
    position,
    'hxCard'
  );

  this.isEnabled = allowedIn !== null;
}
```

### Nested Component Support

Allow HELIX components inside component slots.

```javascript
// In schema definition
schema.register('hxCardActions', {
  allowIn: 'hxCard',
  allowContentOf: '$root', // Allows any content, including other components
  allowChildren: ['hxButton', 'hxBadge'], // Explicitly allow specific components
  isLimit: true,
});

// Register hxButton schema
schema.register('hxButton', {
  inheritAllFrom: '$inlineObject',
  allowAttributes: ['variant', 'hx-size', 'type', 'disabled'],
  allowWhere: '$text',
});
```

### Live Preview with Actual Components

Replace editor placeholders with actual web component rendering.

```javascript
// Advanced: Load HELIX library in editor iframe
conversion.for('editingDowncast').elementToElement({
  model: 'hxCard',
  view: (modelElement, { writer: viewWriter }) => {
    // Create actual <hx-card> element in editor
    const card = viewWriter.createRawElement(
      'hx-card',
      {
        variant: modelElement.getAttribute('variant'),
        elevation: modelElement.getAttribute('elevation'),
      },
      function (domElement) {
        // domElement is the actual DOM node
        // HELIX will hydrate it when library loads
      },
    );

    return toWidget(card, viewWriter, {
      label: 'HX Card',
    });
  },
});
```

**Caution**: This approach requires loading the HELIX library in the editor iframe. It increases editor load time but provides true WYSIWYG preview.

## Troubleshooting

### Plugin Not Appearing in Toolbar

**Check build output** - Ensure `js/build/hxCard.js` exists and isn't empty.

**Verify library loading** - Check browser console for JavaScript errors. The plugin might fail to load due to syntax errors or missing dependencies.

**CKEditor version mismatch** - Plugin must be built against the same CKEditor version Drupal uses. Check `package.json` version matches Drupal core's CKEditor version.

**Cache** - Clear Drupal cache: `drush cr`

### Component HTML Not Saving

**Check allowed HTML tags** - Text format must explicitly allow `<hx-card>` and all slot elements.

**GHS (General HTML Support)** - In Drupal 10.1+, CKEditor 5 uses GHS for custom elements. Ensure your element patterns match GHS configuration.

```yaml
# In ckeditor5.yml
drupal:
  elements:
    - <hx-card>
    - <hx-card variant>
    - <hx-card elevation>
    - <hx-card href>
    - <span slot>
    - <div slot>
```

### Slots Not Converting Correctly

**Upcast priority** - If slots aren't converting, check conversion priority. Multiple converters might conflict.

```javascript
conversion.for('upcast').elementToElement({
  view: {
    name: 'div',
    attributes: { slot: 'media' },
  },
  model: 'hxCardMedia',
  converterPriority: 'high', // Ensure this runs before generic div converters
});
```

### Widget Not Selectable in Editor

**Missing toWidget()** - Editing downcast must use `toWidget()` wrapper.

**Widget plugin dependency** - Editing plugin must require Widget plugin: `static get requires() { return [Widget]; }`

## Best Practices

### Keep Model Schema Semantic

Model elements should represent semantic meaning, not visual presentation. `hxCardHeading` is semantic. `hxCardBoldText` is presentational.

```javascript
// Good: Semantic
schema.register('hxCardHeading', {
  allowIn: 'hxCard',
  allowContentOf: '$block',
});

// Bad: Presentational
schema.register('hxCardRedText', {
  allowIn: 'hxCard',
  allowContentOf: '$block',
});
```

### Minimize Custom Converters

CKEditor provides helper functions for common conversion patterns. Use them instead of writing custom converter functions.

```javascript
// Preferred: Helper
conversion.for('dataDowncast').elementToElement({
  model: 'hxCardHeading',
  view: {
    name: 'span',
    attributes: { slot: 'heading' },
  },
});

// Avoid: Custom function (unless necessary)
conversion.for('dataDowncast').elementToElement({
  model: 'hxCardHeading',
  view: (modelElement, { writer }) => {
    return writer.createContainerElement('span', { slot: 'heading' });
  },
});
```

### Test with Real Drupal Content

Test component insertion with actual Drupal field rendering output. Paste rendered Media entities, formatted text fields, and Views output into component slots.

### Progressive Enhancement in Editor

Provide fallback styling for widgets in case CSS doesn't load. Use inline styles or data attributes for critical visual cues.

### Document Slot Contracts

Maintain clear documentation about what content belongs in each slot. This helps editors understand the component model.

## Plugin Development Checklist

Before deploying a HELIX CKEditor plugin:

- [ ] Model schema defined for all component parts
- [ ] Upcast converters handle all HTML variations
- [ ] Downcast converters produce valid component HTML
- [ ] Editing downcast creates recognizable widgets
- [ ] Command validates insertion context
- [ ] UI provides clear, accessible form controls
- [ ] Widget styling uses CKEditor theme variables
- [ ] Plugin builds without errors
- [ ] Drupal libraries configured correctly
- [ ] Text format allows all component HTML
- [ ] Tested with Drupal field formatters (Media, text formats)
- [ ] Keyboard navigation works in editor
- [ ] Screen reader announces widget type
- [ ] Component saves and loads correctly
- [ ] No console errors in browser

## Complete Example: HX Button Plugin

A simpler example demonstrating inline component insertion.

```javascript
// hxbuttonediting.js
import { Plugin } from 'ckeditor5/src/core';
import { Widget, toWidget } from 'ckeditor5/src/widget';

export default class HxButtonEditing extends Plugin {
  static get requires() {
    return [Widget];
  }

  init() {
    this._defineSchema();
    this._defineConverters();
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.register('hxButton', {
      inheritAllFrom: '$inlineObject',
      allowAttributes: ['variant', 'hxSize', 'type', 'disabled'],
      allowWhere: '$text',
    });
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

    // Upcast
    conversion.for('upcast').elementToElement({
      view: {
        name: 'hx-button',
      },
      model: (viewElement, { writer }) => {
        return writer.createElement('hxButton', {
          variant: viewElement.getAttribute('variant') || 'primary',
          hxSize: viewElement.getAttribute('hx-size') || 'md',
          type: viewElement.getAttribute('type') || 'button',
          disabled: viewElement.hasAttribute('disabled'),
        });
      },
    });

    // Data downcast
    conversion.for('dataDowncast').elementToElement({
      model: 'hxButton',
      view: (modelElement, { writer }) => {
        const button = writer.createContainerElement('hx-button', {
          variant: modelElement.getAttribute('variant'),
          'hx-size': modelElement.getAttribute('hxSize'),
          type: modelElement.getAttribute('type'),
          disabled: modelElement.getAttribute('disabled') ? '' : null,
        });

        return button;
      },
    });

    // Editing downcast
    conversion.for('editingDowncast').elementToElement({
      model: 'hxButton',
      view: (modelElement, { writer }) => {
        const span = writer.createContainerElement('span', {
          class: 'hx-button-widget',
          'data-variant': modelElement.getAttribute('variant'),
        });

        return toWidget(span, writer, {
          label: 'HX Button',
        });
      },
    });

    // Button text content
    conversion.for('editingDowncast').add((dispatcher) => {
      dispatcher.on(
        'insert:$text',
        (evt, data, conversionApi) => {
          const modelPosition = data.range.start;
          const parent = modelPosition.parent;

          if (parent.name !== 'hxButton') {
            return;
          }

          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(parent);

          viewWriter.insert(
            viewWriter.createPositionAt(viewElement, 0),
            viewWriter.createText(parent.getChild(0).data),
          );
        },
        { priority: 'low' },
      );
    });
  }
}
```

This button plugin demonstrates:

- Inline object pattern (buttons flow with text)
- Attribute mapping with naming variations (hx-size → hxSize)
- Boolean attribute handling
- Text content within components

## Resources

Official documentation and community resources for CKEditor 5 plugin development.

### CKEditor 5 Documentation

- [Plugin Development Guide](https://ckeditor.com/docs/ckeditor5/latest/framework/architecture/plugins.html) - Core plugin architecture
- [Implementing a Block Widget](https://ckeditor.com/docs/ckeditor5/latest/framework/tutorials/widgets/implementing-a-block-widget.html) - Widget tutorial
- [Upcast Conversion](https://ckeditor.com/docs/ckeditor5/latest/framework/deep-dive/conversion/upcast.html) - View to model
- [Downcast Conversion](https://ckeditor.com/docs/ckeditor5/latest/framework/deep-dive/conversion/downcast.html) - Model to view
- [UI Components](https://ckeditor.com/docs/ckeditor5/latest/framework/architecture/ui-components.html) - Building dialogs

### Drupal Integration

- [CKEditor 5 Module Documentation](https://www.drupal.org/docs/core-modules-and-themes/core-modules/ckeditor-5-module) - Drupal-specific implementation
- [Plugin and Contrib Module Development](https://www.drupal.org/docs/core-modules-and-themes/core-modules/ckeditor-5-module/plugin-and-contrib-module-development) - Creating Drupal modules
- [How to Integrate CKEditor 5 Plugin in Drupal](https://lembergsolutions.com/blog/how-integrate-ckeditor5-plugin-drupal-9-10-module) - Step-by-step guide
- [Creating CKEditor 5 Custom Plugin in Drupal 11](https://opensenselabs.com/blog/ckeditor-5) - Updated for Drupal 11

### Code Examples

- [ckeditor5-webcomponent](https://github.com/FabienHenon/ckeditor5-webcomponent) - Web component wrapper reference
- [CKEditor 5 Plugin Pack](https://www.drupal.org/project/ckeditor5_plugin_pack) - Collection of contrib plugins

## Next Steps

You now have comprehensive knowledge of CKEditor 5 plugin development for HELIX components. Continue with:

- **[TWIG Integration](/drupal-integration/twig/fundamentals/)** - How components render in templates
- **[Drupal Behaviors](/drupal-integration/behaviors/)** - JavaScript lifecycle integration
- **[Form API Integration](/drupal-integration/forms/)** - Using components in Drupal forms
- **[Performance Optimization](/guides/performance/)** - Optimizing component loading

For component-specific integration:

- **[hx-card API](/components/hx-card/)** - Card component documentation
- **[hx-button API](/components/hx-button/)** - Button component documentation
- **[All Components](/components/)** - Complete component library

---

**Sources:**

- [CKEditor 5 Plugin Pack | Drupal.org](https://www.drupal.org/project/ckeditor5_plugin_pack)
- [Plugin and Contrib module development | CKEditor 5 module | Drupal Wiki](https://www.drupal.org/docs/core-modules-and-themes/core-modules/ckeditor-5-module/plugin-and-contrib-module-development)
- [How to integrate CKEditor 5 plugin in the Drupal module? | Lemberg Solutions](https://lembergsolutions.com/blog/how-integrate-ckeditor5-plugin-drupal-9-10-module)
- [Creating CKEditor 5 Custom Plugin in Drupal 11 | Opensense Labs](https://opensenselabs.com/blog/ckeditor-5)
- [Custom widgets and components | CKEditor 5 Documentation](https://ckeditor.com/docs/ckeditor5/latest/features/custom-components.html)
- [Implementing a block widget tutorial | CKEditor 5 Documentation](https://ckeditor.com/docs/ckeditor5/latest/framework/tutorials/widgets/implementing-a-block-widget.html)
- [Widget internals | CKEditor 5 Framework Documentation](https://ckeditor.com/docs/ckeditor5/latest/framework/deep-dive/ui/widget-internals.html)
- [Upcast conversion - view to model | CKEditor 5 Framework](https://ckeditor.com/docs/ckeditor5/latest/framework/deep-dive/conversion/upcast.html)
- [Downcast conversion - model to view | CKEditor 5 Framework](https://ckeditor.com/docs/ckeditor5/latest/framework/deep-dive/conversion/downcast.html)
