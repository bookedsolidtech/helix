/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Starlight virtual module declarations
// These modules are resolved at build time by the Starlight integration
declare module 'virtual:starlight/user-config' {
  const config: {
    pagefind: boolean;
    components: Record<string, string>;
    social: Array<{ icon: string; label: string; link: string }>;
    [key: string]: unknown;
  };
  export default config;
}

declare module 'virtual:starlight/components/LanguageSelect' {
  const LanguageSelect: astroHTML.JSX.Element;
  export default LanguageSelect;
}

declare module 'virtual:starlight/components/Search' {
  const Search: astroHTML.JSX.Element;
  export default Search;
}

declare module 'virtual:starlight/components/SiteTitle' {
  const SiteTitle: astroHTML.JSX.Element;
  export default SiteTitle;
}

declare module 'virtual:starlight/components/SocialIcons' {
  const SocialIcons: astroHTML.JSX.Element;
  export default SocialIcons;
}

declare module 'virtual:starlight/components/ThemeSelect' {
  const ThemeSelect: astroHTML.JSX.Element;
  export default ThemeSelect;
}
