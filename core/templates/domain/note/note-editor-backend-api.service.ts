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
 * @fileoverview Service to send changes to a note to the backend.
 */

import {downgradeInjectable} from '@angular/upgrade/static';
import {Injectable} from '@angular/core';
import {NoteBackendDict, NoteData} from 'domain/note/note.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {HttpClient} from '@angular/common/http';
import {NotesPageConstants} from 'pages/notes-page/notes-page.constants';
import {NoteChangeDict} from 'domain/note/note-update.service';

interface NoteUpdateBackendDict {
  note: NoteBackendDict;
}

interface NoteUpdatedData {
  noteDict: NoteData;
}

interface DeleteNoteBackendResponse {
  status: number;
}

interface NoteEditorBackendResponse {
  note_dict: NoteBackendDict;
  displayed_author_name: string;
}

export interface NoteEditorData {
  noteDict: NoteData;
  displayedAuthorName: string;
}

@Injectable({
  providedIn: 'root',
})
export class NoteEditorBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchNoteEditorData(noteId: string): Promise<NoteEditorData> {
    return new Promise((resolve, reject) => {
      const noteDataUrl = this.urlInterpolationService.interpolateUrl(
        NotesPageConstants.NOTE_EDITOR_DATA_URL_TEMPLATE,
        {
          note_id: noteId,
        }
      );
      this.http
        .get<NoteEditorBackendResponse>(noteDataUrl)
        .toPromise()
        .then(
          response => {
            resolve({
              displayedAuthorName: response.displayed_author_name,
              noteDict: NoteData.createFromBackendDict(response.note_dict),
            });
          },
          errorResponse => {
            reject(errorResponse.status);
          }
        );
    });
  }

  async deleteNoteAsync(noteId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const noteDataUrl = this.urlInterpolationService.interpolateUrl(
        NotesPageConstants.NOTE_EDITOR_DATA_URL_TEMPLATE,
        {
          note_id: noteId,
        }
      );

      this.http
        .delete<DeleteNoteBackendResponse>(noteDataUrl)
        .toPromise()
        .then(
          response => {
            resolve(response.status);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async updateNoteDataAsync(
    noteId: string,
    newPublishStatus: boolean,
    changeDict: NoteChangeDict
  ): Promise<NoteUpdatedData> {
    return new Promise((resolve, reject) => {
      const noteDataUrl = this.urlInterpolationService.interpolateUrl(
        NotesPageConstants.NOTE_EDITOR_DATA_URL_TEMPLATE,
        {
          note_id: noteId,
        }
      );

      const putData = {
        new_publish_status: newPublishStatus,
        change_dict: changeDict,
      };

      this.http
        .put<NoteUpdateBackendDict>(noteDataUrl, putData)
        .toPromise()
        .then(
          response => {
            resolve({
              noteDict: NoteData.createFromBackendDict(response.note),
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }
}

angular
  .module('oppia')
  .factory(
    'NoteEditorBackendApiService',
    downgradeInjectable(NoteEditorBackendApiService)
  );
