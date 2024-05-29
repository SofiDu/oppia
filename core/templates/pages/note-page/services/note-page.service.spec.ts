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
 * @fileoverview Unit Tests for Note Page service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {NotePageService} from 'pages/note-page/services/note-page.service';

describe('Note Page service', () => {
  let notePageService: NotePageService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    notePageService = TestBed.inject(NotePageService);
  });

  it('should set and retrieve noteId correctly', () => {
    notePageService.noteId = 'abc123456abc';

    expect(notePageService.noteId).toEqual('abc123456abc');
  });
});
