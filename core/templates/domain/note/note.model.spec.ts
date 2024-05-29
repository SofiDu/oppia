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
 * @fileoverview Tests for note model.
 */
import {NoteData} from 'domain/note/note.model';

describe('Note Object Factory', () => {
  let sampleNoteData: NoteData;

  beforeEach(() => {
    let sampleNotetBackendDict = {
      id: 'sampleId',
      displayed_author_name: 'testUsername',
      title: 'sampleTitle',
      subtitle: 'samplesubTitle',
      content: '<p>Hello</p>',
      url_fragment: 'sampleUrl',
      last_updated: '3454354354',
      published_on: '3454354354',
    };
    sampleNoteData = NoteData.createFromBackendDict(sampleNotetBackendDict);
  });

  it('should not find issues with a valid note post', () => {
    expect(sampleNoteData.validate()).toEqual([]);
  });

  it('should raise correct validation issues', () => {
    sampleNoteData.title = '';
    sampleNoteData.content = '';

    expect(sampleNoteData.validate()).toEqual([
      'Note title should not be empty.',
      'Note content should not be empty.',
    ]);

    sampleNoteData.title = 'aa';
    expect(sampleNoteData.validate()).toEqual([
      'Note title should not be less than 5 characters.',
      'Note content should not be empty.',
    ]);

    sampleNoteData.title = 'aa'.repeat(65);
    expect(sampleNoteData.validate()).toEqual([
      'Note title should not be more than 65 characters.',
      'Note content should not be empty.',
    ]);

    // Title contains invalid special characters. Only hyphens(-), ampersand(&)
    // and colon(:) are allowed.
    sampleNoteData.title = 'invalid chars#';
    expect(sampleNoteData.validate()).toEqual([
      'Note title contains invalid characters.',
      'Note content should not be empty.',
    ]);
  });
});
