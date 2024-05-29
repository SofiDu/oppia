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
 * @fileoverview Service to get data for to a note homepage from backend.
 */

import {downgradeInjectable} from '@angular/upgrade/static';

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {
  NoteSummaryBackendDict,
  NoteSummary,
} from 'domain/note/note-summary.model';
import {NoteHomePageConstants} from 'pages/note-home-page/note-home-page.constants';
import {NotePageConstants} from 'pages/note-page/note-page.constants';
import {NoteBackendDict, NoteData} from 'domain/note/note.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

export interface NoteHomePageBackendResponse {
  no_of_note_summaries: number;
  note_summary_dicts: NoteSummaryBackendDict[];
}

export interface SearchResponseBackendDict {
  search_offset: number | null;
  note_summaries_list: NoteSummaryBackendDict[];
}

export interface NotePageBackendResponse {
  author_username: string;
  note_dict: NoteBackendDict;
  summary_dicts: NoteSummaryBackendDict[];
}

export interface SearchResponseData {
  searchOffset: number | null;
  noteSummariesList: NoteSummary[];
}

export interface NoteHomePageData {
  numOfPublishedNotes: number;
  noteSummaryDicts: NoteSummary[];
}

export interface NotePageData {
  authorUsername: string;
  noteDict: NoteData;
  summaryDicts: NoteSummary[];
}

@Injectable({
  providedIn: 'root',
})
export class NoteHomePageBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchNoteHomePageDataAsync(offset: string): Promise<NoteHomePageData> {
    return new Promise((resolve, reject) => {
      this.http
        .get<NoteHomePageBackendResponse>(
          NoteHomePageConstants.NOTE_HOMEPAGE_DATA_URL_TEMPLATE +
            '?offset=' +
            offset
        )
        .toPromise()
        .then(
          response => {
            resolve({
              numOfPublishedNotes: response.no_of_note_summaries,
              noteSummaryDicts: response.note_summary_dicts.map(noteSummary => {
                return NoteSummary.createFromBackendDict(noteSummary);
              }),
            });
          },
          errorResponse => {
            reject(errorResponse);
          }
        );
    });
  }

  async fetchNoteSearchResultAsync(
    searchQuery: string
  ): Promise<SearchResponseData> {
    return new Promise((resolve, reject) => {
      this.http
        .get<SearchResponseBackendDict>(
          NoteHomePageConstants.NOTE_SEARCH_DATA_URL + searchQuery
        )
        .toPromise()
        .then(
          response => {
            resolve({
              searchOffset: response.search_offset,
              noteSummariesList: response.note_summaries_list.map(
                noteSummary => {
                  return NoteSummary.createFromBackendDict(noteSummary);
                }
              ),
            });
          },
          errorResponse => {
            reject(errorResponse);
          }
        );
    });
  }

  async fetchNotePageDataAsync(noteUrl: string): Promise<NotePageData> {
    return new Promise((resolve, reject) => {
      const noteDataUrl = this.urlInterpolationService.interpolateUrl(
        NotePageConstants.NOTE_PAGE_DATA_URL_TEMPLATE,
        {
          note_url: noteUrl,
        }
      );
      this.http
        .get<NotePageBackendResponse>(noteDataUrl)
        .toPromise()
        .then(
          response => {
            resolve({
              authorUsername: response.author_username,
              summaryDicts: response.summary_dicts.map(noteSummary => {
                return NoteSummary.createFromBackendDict(noteSummary);
              }),
              noteDict: NoteData.createFromBackendDict(response.note_dict),
            });
          },
          errorResponse => {
            reject(errorResponse);
          }
        );
    });
  }
}

angular
  .module('oppia')
  .factory(
    'NoteHomePageBackendApiService',
    downgradeInjectable(NoteHomePageBackendApiService)
  );
