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
import {AlertsService} from 'services/alerts.service';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {
  NotePageData,
  NoteHomePageBackendApiService,
} from 'domain/note/note-homepage-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {PageHeadService} from 'services/page-head.service';
import {UrlService} from 'services/contextual/url.service';
import {NoteData} from 'domain/note/note.model';
import {PageTitleService} from 'services/page-title.service';
import {UserService} from 'services/user.service';

@Component({
  selector: 'oppia-note-page-root',
  templateUrl: './note-page-root.component.html',
})
export class NotePageRootComponent implements OnDestroy, OnInit {
  directiveSubscriptions = new Subscription();
  pageIsShown: boolean = false;
  errorPageIsShown: boolean = false;
  noteUrlFragment!: string;
  note!: NoteData;
  notePageData!: NotePageData;

  constructor(
    private accessValidationBackendApiService: AccessValidationBackendApiService,
    private blogHomePageBackendApiService: NoteHomePageBackendApiService,
    private loaderService: LoaderService,
    private alertsService: AlertsService,
    private pageHeadService: PageHeadService,
    private translateService: TranslateService,
    private pageTitleService: PageTitleService,
    private urlService: UrlService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
    this.noteUrlFragment = this.urlService.getNoteUrlFromUrl();
    this.loaderService.showLoadingScreen('Loading');
    this.userService.canUserEditNotes().then(userCanEditNote => {
      this.accessValidationBackendApiService
        .validateAccessToNotePage(this.noteUrlFragment)
        .then(
          resp => {
            this.fetchNoteData(this.noteUrlFragment);
          },
          err => {
            this.errorPageIsShown = true;
            this.loaderService.hideLoadingScreen();
          }
        );
    });
  }

  setPageTitle(): void {
    let notePage = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.NOTE_PAGE;
    const translatedTitle = this.translateService.instant(notePage.TITLE, {
      noteTitle: this.note.title,
    });
    this.pageHeadService.updateTitle(translatedTitle);
  }

  fetchNoteData(noteUrl: string): void {
    this.blogHomePageBackendApiService.fetchNotePageDataAsync(noteUrl).then(
      (response: NotePageData) => {
        this.note = response.noteDict;
        this.notePageData = response;
        this.pageIsShown = true;
        this.loaderService.hideLoadingScreen();
      },
      error => {
        this.alertsService.addWarning(
          `Unable to fetch note data.Error: ${error.error.error}`
        );
      }
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
