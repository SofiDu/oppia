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
 * @fileoverview Unit tests for NoteHomepageBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  NoteHomePageBackendApiService,
  NoteHomePageData,
} from 'domain/note/note-homepage-backend-api.service';
import {
  NoteSummary,
  NoteSummaryBackendDict,
} from 'domain/note/note-summary.model';
import {NoteBackendDict, NoteData} from 'domain/note/note.model';
import {NoteHomePageConstants} from 'pages/note-home-page/note-home-page.constants';

describe('Note home page backend api service', () => {
  let noteHomePageBackendApiService: NoteHomePageBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let noteSummary: NoteSummaryBackendDict = {
    id: 'sampleNoteId',
    author_username: 'test_username',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    subtitle: 'sample_subtitle',
    summary: 'hello',
    url_fragment: 'sample-url',
    last_updated: '3232323',
    published_on: '1212121',
  };
  let note: NoteBackendDict = {
    id: 'sampleNoteId',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    content: 'hello Note Post',
    subtitle: 'sample_subtitle',
    url_fragment: 'sample-url',
    last_updated: '3232323',
    published_on: '1212121',
  };
  let noteHomePageDataObject: NoteHomePageData;
  let noteObject: NoteData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    noteHomePageBackendApiService = TestBed.inject(
      NoteHomePageBackendApiService
    );
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    noteHomePageDataObject = {
      numOfPublishedNotePosts: 0,
      noteSummaryDicts: [],
    };
    noteSummaryObject = NoteSummary.createFromBackendDict(noteSummary);
    searchResponseData = {
      searchOffset: null,
      noteSummariesList: [],
    };
    noteObject = NoteData.createFromBackendDict(note);
    notePageBackendResponse = {
      author_username: 'test_username',
      note_dict: note,
      summary_dicts: [] as NoteSummaryBackendDict[],
    };
    notePageDataObject = {
      author_Username: 'test_username',
      noteDict: noteObject,
      summaryDicts: [],
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch the note home page data.', fakeAsync(() => {
    noteHomePageBackendApiService
      .fetchNoteHomePageDataAsync('0')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      NoteHomePageConstants.NOTE_HOMEPAGE_DATA_URL_TEMPLATE + '?offset=0'
    );
    expect(req.request.method).toEqual('GET');

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(noteHomePageDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
