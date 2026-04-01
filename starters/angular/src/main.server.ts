import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component.js';
import { appServerConfig } from './app/app.config.server.js';

const bootstrap = () => bootstrapApplication(AppComponent, appServerConfig);

export default bootstrap;
