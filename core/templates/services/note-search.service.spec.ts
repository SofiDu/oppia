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
 * @fileoverview Tests that note post search service gets correct results.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {
  NotePostSearchService,
  UrlSearchQuery,
} from 'services/note-search.service';
import {NoteHomePageBackendApiService} from 'domain/note/note-homepage-backend-api.service';

describe('Note Post Search Service', () => {
  let searchService: NotePostSearchService;
  let response: UrlSearchQuery;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotePostSearchService, NoteHomePageBackendApiService],
    });
    searchService = TestBed.inject(NotePostSearchService);
    noteHomePageBackendApiService = TestBed.inject(
      NoteHomePageBackendApiService
    );
  });

  describe('updateSearchFieldsBasedOnUrlQuery', () => {
    let urlSearchQuery: string;

    it('should find as many keywords as provided in search query', () => {
      urlSearchQuery =
        '?q=protractor%20note%20test&tags=("News"%20OR%20' + '"Mathematics")';
      response =
        searchService.updateSearchFieldsBasedOnUrlQuery(urlSearchQuery);
      expect(response.searchQuery).toEqual('protractor note test');
    });
  });
});
