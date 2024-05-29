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
 * @fileoverview Tests for Note update service.
 */

import {NoteUpdateService} from 'domain/note/note-update.service';
import {NoteData} from 'domain/note/note.model';
import {TestBed} from '@angular/core/testing';

describe('Note update service', () => {
  let noteUpdateService: NoteUpdateService;
  let sampleNote: NoteData;

  beforeEach(() => {
    noteUpdateService = TestBed.inject(NoteUpdateService);
    let sampleNoteBackendDict = {
      id: 'sampleId',
      displayed_author_name: 'testUsername',
      title: 'sampleTitle',
      subtitle: 'sampleSubTitle',
      content: '<p>Hello</p>',
      url_fragment: 'sampleUrl',
      last_updated: '3454354354',
      published_on: '3454354354',
    };
    sampleNote = NoteData.createFromBackendDict(sampleNoteBackendDict);
  });

  it('should update the note title and add the change in change dict', () => {
    let expectedChangeDict = {
      title: 'story',
    };
    expect(sampleNote.title).toEqual('sampleTitle');

    noteUpdateService.setNoteTitle(sampleNote, 'story');

    expect(sampleNote.title).toEqual('story');
    expect(noteUpdateService.getNoteChangeDict()).toEqual(expectedChangeDict);
  });

  it('should update the note post content and add the change in change dict', () => {
    let expectedChangeDict = {
      content: '<p>Hello World</p>',
    };
    expect(sampleNote.content).toEqual('<p>Hello</p>');

    noteUpdateService.setNoteContent(sampleNote, '<p>Hello World</p>');

    expect(sampleNote.content).toEqual('<p>Hello World</p>');
    expect(noteUpdateService.getNoteChangeDict()).toEqual(expectedChangeDict);
  });
});
