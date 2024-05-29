// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar breadcrumb of the notes.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {AppConstants} from 'app.constants';
import {AlertsService} from 'services/alerts.service';
import {
  NoteData,
  NoteBackendApiService,
} from 'domain/note/note-page-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {Subscription} from 'rxjs';
import {NotesPageService} from 'pages/notes-page/services/notes-page.service';
import {NoteSummary} from 'domain/note/note-summary.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UserService} from 'services/user.service';

@Component({
  selector: 'oppia-notes-page',
  templateUrl: './notes-page.component.html',
})
export class NotesPageComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeTab!: string;
  authorName!: string;
  noteData!: NoteData;
  username!: string | null;
  windowIsNarrow: boolean = false;
  activeView: string = 'gridView';
  directiveSubscriptions = new Subscription();
  constructor(
    private alertsService: AlertsService,
    private notesBackendService: NoteBackendApiService,
    private notesPageService: NotesPageService,
    private loaderService: LoaderService,
    private userService: UserService,
    private ngbModal: NgbModal,
    private windowDimensionService: WindowDimensionsService
  ) {}

  ngOnInit(): void {
    this.activeTab = this.notesPageService.activeTab;
    if (this.activeTab === 'main') {
      this.initMainTab();
    }

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    });

    this.directiveSubscriptions.add(
      this.notesPageService.updateViewEventEmitter.subscribe(() => {
        this.activeTab = this.notesPageService.activeTab;
        if (this.activeTab === 'main') {
          this.initMainTab();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();
  }

  async initMainTab(): Promise<void> {
    this.loaderService.showLoadingScreen('Loading');
    await this.getUserInfoAsync();
    this.notesBackendService.fetchNoteDataAsync().then(
      data => {
        this.noteData = data;
        this.loaderService.hideLoadingScreen();
      },
      errorResponse => {
        if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse) !== -1) {
          this.alertsService.addWarning('Failed to get notes data');
        }
      }
    );
  }

  createNewNotesPost(): void {
    this.notesBackendService.createNoteAsync().then(
      notesPostId => {
        this.notesPageService.navigateToEditorTabWithId(notesPostId);
      },
      error => {
        this.alertsService.addWarning(
          `Unable to create new notes post. Error: ${error}`
        );
      }
    );
  }

  unpublishedNotesPost(noteSummary: NoteSummary): void {
    let summaryDicts = this.noteData.publishedNoteSummaryDicts;
    let index = summaryDicts.indexOf(noteSummary);
    if (index > -1) {
      summaryDicts.splice(index, 1);
    }
    this.noteData.draftNoteSummaryDicts.unshift(noteSummary);
    this.noteData.numOfDraftNotes += 1;
    this.noteData.numOfPublishedNotes -= 1;
  }

  removeNotesPost(
    notesPostSummary: NoteSummary,
    notesPostWasPublished: boolean
  ): void {
    let summaryDicts: NoteSummary[];
    if (notesPostWasPublished) {
      summaryDicts = this.noteData.publishedNoteSummaryDicts;
      this.noteData.numOfPublishedNotes -= 1;
    } else {
      summaryDicts = this.noteData.draftNoteSummaryDicts;
      this.noteData.numOfDraftNotes -= 1;
    }
    let index = summaryDicts.indexOf(notesPostSummary);
    if (index > -1) {
      summaryDicts.splice(index, 1);
    }
  }
}

angular.module('oppia').directive(
  'oppiaNotesPage',
  downgradeComponent({
    component: NotesPageComponent,
  }) as angular.IDirectiveFactory
);
