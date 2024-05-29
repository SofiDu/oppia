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
 * @fileoverview Unit tests for note-summary-model.
 */

import {TestBed} from '@angular/core/testing';

import {NoteSummary} from 'domain/note/note-summary.model';

describe('Notesummary object factory', () => {
  let sampleSummary: NoteSummary;
  let sampleSummaryBackendObject = {
    id: 'sampleId',
    author_username: 'test_user',
    displayed_author_name: 'test_user_name',
    title: 'Title',
    subtitle: 'Subtitle',
    summary: 'Hello World',
    url_fragment: 'title',
    last_updated: '3232323',
    published_on: '3232323',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NoteSummary],
    });
  });

  it('should create correct NoteSummary object from' + ' backend dict', () => {
    sampleSummary = NoteSummary.createFromBackendDict(
      sampleSummaryBackendObject
    );

    expect(sampleSummary.id).toEqual('sampleId');
    expect(sampleSummary.authorUsername).toEqual('test_user');
    expect(sampleSummary.displayedAuthorName).toEqual('test_user_name');
    expect(sampleSummary.title).toEqual('Title');
    expect(sampleSummary.title).toEqual('Subtitle');
    expect(sampleSummary.summary).toEqual('Hello World');
    expect(sampleSummary.urlFragment).toEqual('title');
    expect(sampleSummary.lastUpdated).toEqual('3232323');
    expect(sampleSummary.publishedOn).toEqual('3232323');
  });
});
