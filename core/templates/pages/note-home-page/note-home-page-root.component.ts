// Copyright 2022 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Root component for note home page.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {PageHeadService} from 'services/page-head.service';
import {UserService} from 'services/user.service';

@Component({
  selector: 'oppia-note-home-page-root',
  templateUrl: './note-home-page-root.component.html',
})
export class NoteHomePageRootComponent implements OnDestroy, OnInit {
  directiveSubscriptions = new Subscription();
  errorPageIsShown: boolean = false;
  pageIsShown: boolean = false;

  constructor(
    private accessValidationBackendApiService: AccessValidationBackendApiService,
    private loaderService: LoaderService,
    private pageHeadService: PageHeadService,
    private translateService: TranslateService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.setPageTitle();

    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );

    this.loaderService.showLoadingScreen('Loading');
    this.userService.canUserEditNotes().then(userCanEditNotePost => {
      this.accessValidationBackendApiService
        .validateAccessToNoteHomePage()
        .then(
          resp => {
            this.pageIsShown = true;
          },
          err => {
            this.errorPageIsShown = true;
          }
        )
        .then(() => {
          this.loaderService.hideLoadingScreen();
        });
    });
  }

  setPageTitle(): void {
    const noteHomePage =
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.NOTE_HOMEPAGE;
    const translatedTitle = this.translateService.instant(noteHomePage.TITLE);
    this.pageHeadService.updateTitleAndMetaTags(
      translatedTitle,
      noteHomePage.META
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
