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
 * @fileoverview Unit tests for NoteBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  NoteBackendApiService,
  NoteBackendResponse,
  NoteData,
} from 'domain/note/note-page-backend-api.service';
import {
  NoteSummary,
  NoteSummaryBackendDict,
} from 'domain/note/note-summary.model';

describe('Note page backend api service', () => {
  let nbas: NoteBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let noteBackendResponse: NoteBackendResponse = {
    no_of_published_notes: 0,
    no_of_draft_notes: 0,
    published_note_summary_dicts: [] as NoteSummaryBackendDict[],
    draft_note_summary_dicts: [] as NoteSummaryBackendDict[],
  };
  let noteSummary: NoteSummaryBackendDict = {
    id: 'sampleBlogId',
    author_username: 'test_sername',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    subtitle: 'sample_subtitle',
    summary: 'hello',
    url_fragment: 'sample#url',
    last_updated: '3232323',
    published_on: '1212121',
  };
  let noteDataObject: NoteData = {
    displayedAuthorName: 'test_name',
    authorBio: 'author bio',
    numOfDraftNotes: noteBackendResponse.no_of_draft_notes,
    numOfPublishedNotes: noteBackendResponse.no_of_published_notes,
    publishedNoteSummaryDicts: [] as NoteSummary[],
    draftNoteSummaryDicts: [] as NoteSummary[],
  };

  let noteSummaryObject = NoteSummary.createFromBackendDict(noteSummary);
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    nbas = TestBed.inject(NoteBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch the notes page data.', fakeAsync(() => {
    nbas.fetchNoteDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      NotePageConstants.NOTE_DASHBOARD_DATA_URL_TEMPLATE
    );
    expect(req.request.method).toEqual('GET');
    req.flush(noteBackendResponse);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(noteDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fetch the notes page data with blog post summary data', fakeAsync(() => {
    noteBackendResponse.published_note_summary_dicts = [noteSummary];
    noteBackendResponse.draft_note_summary_dicts = [noteSummary];
    noteDataObject.publishedNoteSummaryDicts = [noteSummaryObject];
    noteDataObject.draftNoteSummaryDicts = [noteSummaryObject];
    nbas.fetchNoteDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      NoteboardPageConstants.NOTE_DASHBOARD_DATA_URL_TEMPLATE
    );
    expect(req.request.method).toEqual('GET');
    req.flush(noteBackendResponse);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(noteDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
