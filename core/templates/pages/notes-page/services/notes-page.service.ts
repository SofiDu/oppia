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
 * @fileoverview Service that handles data and routing on notes page.
 */

import {Injectable, EventEmitter} from '@angular/core';
import {downgradeInjectable} from '@angular/upgrade/static';
import {AlertsService} from 'services/alerts.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NotesPageConstants} from 'pages/notes-page/notes-page.constants';
import {NoteEditorBackendApiService} from 'domain/note/note-editor-backend-api.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {NoteData} from 'domain/note/note.model';

@Injectable({
  providedIn: 'root',
})
export class NotesPageService {
  // This property is initialized using getters and setters
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _NoteData!: NoteData;
  private _notesPostId: string = '';
  private _NOTES_POST_EDITOR_URL_TEMPLATE =
    NotesPageConstants.NOTE_TAB_URLS.NOTE_EDITOR;

  private _activeTab = 'main';
  private _notesPostAction: string = '';
  private _updateViewEventEmitter = new EventEmitter<void>();
  private _updateNavTitleEventEmitter = new EventEmitter<string>();
  private _imageUploaderIsNarrow: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private notesPostEditorBackendService: NoteEditorBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef,
    private preventPageUnloadEventService: PreventPageUnloadEventService
  ) {
    let currentHash: string = this.windowRef.nativeWindow.location.hash;
    this._setActiveTab(currentHash);
    this.detectUrlChange();
  }

  private _setActiveTab(hash: string) {
    if (hash.startsWith('#/notes_post_editor')) {
      this._activeTab = 'editor_tab';
      this._notesPostId = this.urlService.getNoteIdFromUrl();
    } else {
      this._activeTab = 'main';
      this.preventPageUnloadEventService.removeListener();
    }
    this.updateViewEventEmitter.emit();
  }

  detectUrlChange(): void {
    this.windowRef.nativeWindow.onhashchange = () => {
      let newHash: string = this.windowRef.nativeWindow.location.hash;
      this._setActiveTab(newHash);
    };
  }

  navigateToEditorTabWithId(notesPostId: string): void {
    let notesPostEditorUrl = this.urlInterpolationService.interpolateUrl(
      this._NOTES_POST_EDITOR_URL_TEMPLATE,
      {
        notes_post_id: notesPostId,
      }
    );
    this.windowRef.nativeWindow.location.hash = notesPostEditorUrl;
  }

  navigateToMainTab(): void {
    this.windowRef.nativeWindow.location.href = '/notes-page';
  }

  set notesPostAction(action: string) {
    this._notesPostAction = action;
  }

  get notesPostAction(): string {
    return this._notesPostAction;
  }

  get activeTab(): string {
    return this._activeTab;
  }

  get notesPostId(): string {
    return this._notesPostId;
  }

  set notesPostId(id: string) {
    this._notesPostId = id;
  }

  set NoteData(data: NoteData) {
    this._NoteData = data;
  }

  get NoteData(): NoteData {
    return this._NoteData;
  }

  set imageUploaderIsNarrow(value: boolean) {
    this._imageUploaderIsNarrow = value;
  }

  get imageUploaderIsNarrow(): boolean {
    return this._imageUploaderIsNarrow;
  }

  get updateViewEventEmitter(): EventEmitter<void> {
    return this._updateViewEventEmitter;
  }

  get updateNavTitleEventEmitter(): EventEmitter<string> {
    return this._updateNavTitleEventEmitter;
  }

  deleteNotesPost(): void {
    this.notesPostEditorBackendService.deleteNoteAsync(this._notesPostId).then(
      () => {
        this.alertsService.addSuccessMessage(
          'Notes Post Deleted Successfully.',
          5000
        );
        if (this.activeTab === 'editor_tab') {
          this.navigateToMainTab();
        }
      },
      errorResponse => {
        this.alertsService.addWarning('Failed to delete notes post.');
      }
    );
  }

  setNavTitle(notesPostIsPublished: boolean, title: string): void {
    if (title) {
      if (notesPostIsPublished) {
        return this.updateNavTitleEventEmitter.emit(`Published - ${title}`);
      } else {
        return this.updateNavTitleEventEmitter.emit(`Draft - ${title}`);
      }
    } else {
      return this.updateNavTitleEventEmitter.emit('New Post - Untitled');
    }
  }
}

angular
  .module('oppia')
  .factory('NotesPageService', downgradeInjectable(NotesPageService));
