import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component.js';
import { appConfig } from './app/app.config.js';
// Register all hx-* custom elements
import '@helixui/library';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
