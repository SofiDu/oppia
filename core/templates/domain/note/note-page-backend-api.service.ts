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
 * @fileoverview Service to get data for to a note page from backend.
 */

import {downgradeInjectable} from '@angular/upgrade/static';

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {
  NoteSummaryBackendDict,
  NoteSummary,
} from 'domain/note/note-summary.model';
import {NotesPageConstants} from 'pages/notes-page/notes-page.constants';

export interface NoteBackendResponse {
  no_of_published_notes: number;
  no_of_draft_notes: number;
  published_note_summary_dicts: NoteSummaryBackendDict[];
  draft_note_summary_dicts: NoteSummaryBackendDict[];
}

interface NewNoteBackendResponse {
  note_id: string;
}
export interface NoteData {
  numOfPublishedNotes: number;
  numOfDraftNotes: number;
  publishedNoteSummaryDicts: NoteSummary[];
  draftNoteSummaryDicts: NoteSummary[];
}

@Injectable({
  providedIn: 'root',
})
export class NoteBackendApiService {
  constructor(private http: HttpClient) {}

  async fetchNoteDataAsync(): Promise<NoteData> {
    return new Promise((resolve, reject) => {
      this.http
        .get<NoteBackendResponse>(NotesPageConstants.NOTE_DATA_URL_TEMPLATE)
        .toPromise()
        .then(
          response => {
            resolve({
              numOfDraftNotes: response.no_of_draft_notes,
              numOfPublishedNotes: response.no_of_published_notes,
              publishedNoteSummaryDicts:
                response.published_note_summary_dicts.map(noteSummary => {
                  return NoteSummary.createFromBackendDict(noteSummary);
                }),
              draftNoteSummaryDicts: response.draft_note_summary_dicts.map(
                noteSummary => {
                  return NoteSummary.createFromBackendDict(noteSummary);
                }
              ),
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async createNoteAsync(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http
        .post<NewNoteBackendResponse>(
          NotesPageConstants.NOTE_DATA_URL_TEMPLATE,
          {}
        )
        .toPromise()
        .then(
          response => {
            resolve(response.note_id);
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
  .factory('NoteBackendApiService', downgradeInjectable(NoteBackendApiService));
