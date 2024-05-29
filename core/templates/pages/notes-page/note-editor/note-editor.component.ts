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
 * @fileoverview Component for a note page card.
 */

interface EditorSchema {
  type: string;
  ui_config: object;
}

import {AppConstants} from 'app.constants';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {AlertsService} from 'services/alerts.service';
import {
  NoteEditorData,
  NoteEditorBackendApiService,
} from 'domain/note/note-editor-backend-api.service';
import {NoteUpdateService} from 'domain/note/note-update.service';
import {NotesPageConstants} from 'pages/notes-page/notes-page.constants';
import {NotesPageService} from 'pages/notes-page/services/notes-page.service';
import {NoteData} from 'domain/note/note.model';
import {LoaderService} from 'services/loader.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NotesPostActionConfirmationModalComponent} from 'pages/notes-page/notes-post-action-confirmation/notes-post-action-confirmation.component';
import dayjs from 'dayjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {UserService} from 'services/user.service';

@Component({
  selector: 'oppia-blog-post-editor',
  templateUrl: './blog-post-editor.component.html',
})
export class NoteEditorComponent implements OnInit {
  @ViewChild('titleInput') titleInput!: ElementRef;
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  noteData!: NoteData;
  noteId!: string;
  title!: string;
  subtitle!: string;
  username!: string | null;
  localEditedContent!: string;
  MAX_CHARS_IN_NOTE_POST_TITLE!: number;
  MIN_CHARS_IN_NOTE_POST_TITLE!: number;
  dateTimeLastSaved: string = '';
  authorName: string = '';
  windowIsNarrow: boolean = false;
  contentEditorIsActive: boolean = false;
  invalidImageWarningIsShown: boolean = false;
  newChangesAreMade: boolean = false;
  lastChangesWerePublished: boolean = false;
  saveInProgress: boolean = false;
  publishingInProgress: boolean = false;
  titleEditorIsActive: boolean = false;
  HTML_SCHEMA: EditorSchema = {
    type: 'html',
    ui_config: {
      hide_complex_extensions: false,
      startupFocusEnabled: false,
    },
  };

  NOTE_POST_TITLE_PATTERN: string = AppConstants.VALID_NOTE_TITLE_REGEX;

  constructor(
    private alertsService: AlertsService,
    private notesPageService: NotesPageService,
    private noteEditorBackendService: NoteEditorBackendApiService,
    private noteUpdateService: NoteUpdateService,
    private changeDetectorRef: ChangeDetectorRef,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private windowDimensionService: WindowDimensionsService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private userService: UserService
  ) {}

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.getUserInfoAsync();
    this.noteId = this.notesPageService.notesPostId;
    this.initEditor();
    this.MAX_CHARS_IN_NOTE_POST_TITLE = AppConstants.MAX_CHARS_IN_NOTE_TITLE;
    this.MIN_CHARS_IN_NOTE_POST_TITLE = AppConstants.MIN_CHARS_IN_NOTE_TITLE;
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    });
  }

  getSchema(): EditorSchema {
    return this.HTML_SCHEMA;
  }

  initEditor(): void {
    this.noteEditorBackendService.fetchNoteEditorData(this.noteId).then(
      (editorData: NoteEditorData) => {
        this.noteData = editorData.noteDict;
        this.authorName = editorData.displayedAuthorName;
        this.title = this.noteData.title;
        if (this.title.length === 0) {
          this.titleEditorIsActive = true;
        }
        let lastUpdated = this.noteData.lastUpdated;
        if (lastUpdated) {
          this.dateTimeLastSaved = this.getDateStringInWords(lastUpdated);
        }
        this.contentEditorIsActive = Boolean(
          this.noteData.content.length === 0
        );
        if (this.noteData.publishedOn && this.noteData.lastUpdated) {
          if (
            this.noteData.lastUpdated.slice(0, -8) ===
            this.noteData.publishedOn.slice(0, -8)
          ) {
            this.lastChangesWerePublished = true;
          }
        }
        this.notesPageService.setNavTitle(
          this.lastChangesWerePublished,
          this.title
        );
        this.newChangesAreMade = false;
        this.preventPageUnloadEventService.removeListener();
        this.loaderService.hideLoadingScreen();
      },
      errorResponse => {
        if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse) !== -1) {
          this.alertsService.addWarning(
            'Failed to get Note Data. The Note was either' +
              ' deleted or the Note ID is invalid.'
          );
          this.notesPageService.navigateToMainTab();
        }
      }
    );
  }

  getDateStringInWords(naiveDateTime: string): string {
    let datestring = naiveDateTime.substring(0, naiveDateTime.length - 7);
    return dayjs(datestring, 'MM-DD-YYYY, HH:mm:ss').format(
      'MMMM D, YYYY [at] hh:mm A'
    );
  }

  updateLocalTitleValue(): void {
    this.noteUpdateService.setNoteTitle(this.noteData, this.title);
    this.titleEditorIsActive = false;
  }

  isTitlePatternValid(): boolean {
    let titleRegex: RegExp = new RegExp(this.NOTE_POST_TITLE_PATTERN);
    return titleRegex.test(this.title);
  }

  cancelEdit(): void {
    if (this.noteData.content.length > 0) {
      this.contentEditorIsActive = false;
    }
  }

  updateLocalEditedContent($event: string): void {
    if (this.localEditedContent !== $event) {
      this.localEditedContent = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  activateTitleEditor(): void {
    this.titleInput.nativeElement.focus();
    this.titleEditorIsActive = true;
  }

  updateContentValue(): void {
    this.noteUpdateService.setNoteContent(
      this.noteData,
      this.localEditedContent
    );
    if (this.noteData.content.length > 0) {
      this.contentEditorIsActive = false;
    }
    this.newChangesAreMade = true;
    this.preventPageUnloadEventService.addListener();
  }

  saveDraft(): void {
    this.saveInProgress = true;
    let issues = this.noteData.validate();
    if (issues.length === 0) {
      this.updateNoteData(false);
    } else {
      this.alertsService.addWarning('Please fix the errors.');
      this.saveInProgress = false;
    }
  }

  publishNotePost(): void {
    this.publishingInProgress = true;
    this.notesPageService.notesPostAction =
      NotesPageConstants.NOTE_ACTIONS.PUBLISH;
    this.ngbModal
      .open(NotesPostActionConfirmationModalComponent, {
        backdrop: 'static',
        keyboard: false,
      })
      .result.then(
        () => {
          this.updateNoteData(true);
        },
        () => {
          // This callback is triggered when the Cancel button is clicked.
          this.publishingInProgress = false;
        }
      );
  }
  updateNoteData(isNotePublished: boolean): void {
    let changeDict = this.noteUpdateService.getNoteChangeDict();
    this.noteEditorBackendService
      .updateNoteDataAsync(this.noteId, isNotePublished, changeDict)
      .then(
        () => {
          if (isNotePublished) {
            this.alertsService.addSuccessMessage(
              'Note Saved and Published Successfully.'
            );
            this.lastChangesWerePublished = true;
            this.publishingInProgress = false;
          } else {
            this.alertsService.addSuccessMessage('Note Saved Successfully.');
            this.lastChangesWerePublished = false;
            this.saveInProgress = false;
          }
          this.newChangesAreMade = false;
          this.notesPageService.setNavTitle(
            this.lastChangesWerePublished,
            this.title
          );
          this.preventPageUnloadEventService.removeListener();
        },
        errorResponse => {
          this.alertsService.addWarning(
            `Failed to save Note. Internal Error: ${errorResponse}`
          );
          this.saveInProgress = false;
          this.publishingInProgress = false;
        }
      );
  }

  deleteNote(): void {
    this.notesPageService.notesPostAction = 'delete';
    this.ngbModal
      .open(NotesPostActionConfirmationModalComponent, {
        backdrop: 'static',
        keyboard: false,
      })
      .result.then(
        () => {
          this.notesPageService.deleteNotesPost();
        },
        () => {
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  isPublishButtonDisabled(): boolean {
    if (this.newChangesAreMade) {
      return false;
    } else if (!this.lastChangesWerePublished) {
      return false;
    } else {
      return true;
    }
  }
}

angular.module('oppia').directive(
  'oppiaNoteEditor',
  downgradeComponent({
    component: NoteEditorComponent,
  }) as angular.IDirectiveFactory
);
