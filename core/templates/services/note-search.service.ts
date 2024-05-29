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
 * @fileoverview Search service for Notes.
 */

import {downgradeInjectable} from '@angular/upgrade/static';
import {Injectable, EventEmitter} from '@angular/core';

import {
  NoteHomePageBackendApiService,
  SearchResponseData,
} from 'domain/note/note-homepage-backend-api.service';

export interface UrlSearchQuery {
  searchQuery: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotePostSearchService {
  // These properties are initialized using functions
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _lastQuery!: string;
  private _searchOffset!: number | null;
  private _isCurrentlyFetchingResults = false;
  private _searchBarLoadedEventEmitter = new EventEmitter<string>();
  private _initialSearchResultsLoadedEventEmitter =
    new EventEmitter<SearchResponseData>();

  public numSearchesInProgress = 0;

  constructor(
    private _noteHomePageBackendApiService: NoteHomePageBackendApiService
  ) {}

  hasReachedLastPage(): boolean {
    return this._searchOffset === null;
  }

  getQueryUrl(searchUrlQueryString: string): string {
    return '?q=' + searchUrlQueryString;
  }

  getSearchUrlQueryString(searchQuery: string): string {
    return encodeURIComponent(searchQuery);
  }

  // Note that an empty query results in all notes being shown.
  executeSearchQuery(
    searchQuery: string,
    successCallback: () => void,
    errorCallback?: (reason: string) => void
  ): void {
    const queryUrl = this.getQueryUrl(
      this.getSearchUrlQueryString(searchQuery)
    );
    this._isCurrentlyFetchingResults = true;
    this.numSearchesInProgress++;
    this._noteHomePageBackendApiService
      .fetchNoteSearchResultAsync(queryUrl)
      .then(
        (response: SearchResponseData) => {
          this._lastQuery = searchQuery;
          this._searchOffset = response.searchOffset;
          this.numSearchesInProgress--;

          this._initialSearchResultsLoadedEventEmitter.emit(response);

          this._isCurrentlyFetchingResults = false;
        },
        error => {
          this.numSearchesInProgress--;
          if (errorCallback) {
            errorCallback(error.error.error);
          }
        }
      );

    if (successCallback) {
      successCallback();
    }
  }

  isSearchInProgress(): boolean {
    return this.numSearchesInProgress > 0;
  }

  updateSearchFieldsBasedOnUrlQuery(urlComponent: string): UrlSearchQuery {
    let newSearchQuery: UrlSearchQuery = {
      searchQuery: '',
    };
    const urlQuery = urlComponent.substring('?q='.length);
    const querySegments = urlQuery.split('&');
    newSearchQuery.searchQuery = decodeURIComponent(querySegments[0]);
    for (let i = 1; i < querySegments.length; i++) {
      urlComponent = decodeURIComponent(querySegments[i]);
    }
    return newSearchQuery;
  }

  getCurrentUrlQueryString(): string {
    return this.getSearchUrlQueryString(this._lastQuery);
  }

  // Here failure callback is optional so that it gets invoked
  // only when the end of page has reached and return void otherwise.
  loadMoreData(
    successCallback: (SearchResponseData: SearchResponseData) => void,
    failureCallback?: (arg0: boolean) => void
  ): void {
    // If a new query is still being sent, or the last page has been
    // reached, do not fetch more results.
    if (this._isCurrentlyFetchingResults || this.hasReachedLastPage()) {
      if (failureCallback) {
        failureCallback(this.hasReachedLastPage());
      }
      return;
    }

    let queryUrl = this.getQueryUrl(this.getCurrentUrlQueryString());

    if (this._searchOffset) {
      queryUrl += '&offset=' + this._searchOffset;
    }

    this._isCurrentlyFetchingResults = true;
    this._noteHomePageBackendApiService
      .fetchNoteSearchResultAsync(queryUrl)
      .then((data: SearchResponseData) => {
        this._searchOffset = data.searchOffset;
        this._isCurrentlyFetchingResults = false;

        if (successCallback) {
          successCallback(data);
        }
      });
  }

  get onSearchBarLoaded(): EventEmitter<string> {
    return this._searchBarLoadedEventEmitter;
  }

  get onInitialSearchResultsLoaded(): EventEmitter<SearchResponseData> {
    return this._initialSearchResultsLoadedEventEmitter;
  }
}

angular
  .module('oppia')
  .factory('NotePostSearchService', downgradeInjectable(NotePostSearchService));
