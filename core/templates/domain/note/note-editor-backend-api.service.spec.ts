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
 * @fileoverview Unit tests for NoteEditorBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  NoteEditorData,
  NoteEditorBackendApiService,
} from './note-editor-backend-api.service';
import {NoteData} from 'domain/note/note.model';

describe('Note Editor backend api service', () => {
  let bpebas: NoteEditorBackendApiService;
  let httpTestingController: HttpTestingController;
  let noteEditorDataObject: NoteEditorData;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  let noteEditorBackendResponse = {
    note_dict: {
      id: 'sampleBlogId',
      displayed_author_name: 'test_user',
      title: 'sample_title',
      subtitle: 'sample_subtitle',
      content: '<p>hello</p>',
      url_fragment: 'sample#url',
    },
    displayed_author_name: 'test_user',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    bpebas = TestBed.inject(NoteEditorBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    noteEditorDataObject = {
      displayedAuthorName: noteEditorBackendResponse.displayed_author_name,
      noteDict: NoteData.createFromBackendDict(
        noteEditorBackendResponse.note_dict
      ),
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch the note editor data.', fakeAsync(() => {
    bpebas
      .fetchNoteEditorData('sampleBlogId')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/noteditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(noteEditorBackendResponse);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(noteEditorDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully delete a note', fakeAsync(() => {
    bpebas.deleteNoteAsync('sampleBlogId').then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogeditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('DELETE');
    req.flush({
      status: 200,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(200);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should update a note successfully', fakeAsync(() => {
    let changeDict = {
      title: 'title_sample',
      subtitle: '',
      content: '<p>Hello Blog<P>',
    };
    noteEditorBackendResponse.note_dict.title = changeDict.title;
    noteEditorBackendResponse.note_dict.content = changeDict.content;
    let updatedNote = NoteData.createFromBackendDict(
      noteEditorBackendResponse.note_dict
    );

    bpebas
      .updateNoteDataAsync('sampleNoteId', false, changeDict)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/noteeditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('PUT');
    req.flush({note: noteEditorBackendResponse.note_dict});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({noteDict: updatedNote});
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
