// Global setup for @helixui/react test suite.
// Runs before all tests in every test file.
//
// Guard against duplicate custom element registration errors.
// Each Lit component auto-registers via @customElement decorator when its module
// is first imported. In browser mode, test files share the same browser context
// per file, so cross-import conflicts are rare. This guard handles edge cases.
const _originalDefine = customElements.define.bind(customElements);
Object.defineProperty(customElements, 'define', {
  value(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
    if (!customElements.get(name)) {
      _originalDefine(name, constructor, options);
    }
  },
  configurable: true,
  writable: true,
});
