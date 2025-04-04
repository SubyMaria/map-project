import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 4000,
      progressBar: true,
      closeButton: true,
      newestOnTop: true,
      tapToDismiss: true,
      preventDuplicates: true
    })
  ]
}).catch(err => console.error(err));
