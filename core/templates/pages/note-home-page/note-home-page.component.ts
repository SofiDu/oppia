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
 * @fileoverview Data and component for the note home page.
 */

import {Component, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {AlertsService} from 'services/alerts.service';
import {Subscription} from 'rxjs';
import {AppConstants} from 'app.constants';
import {
  UrlSearchQuery,
  NotePostSearchService,
} from 'services/note-search.service';
import {
  NoteHomePageData,
  NoteHomePageBackendApiService,
} from 'domain/note/note-homepage-backend-api.service';
import {SearchResponseData} from 'domain/note/note-homepage-backend-api.service';
import {NoteSummary} from 'domain/note/note-summary.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {UrlService} from 'services/contextual/url.service';
import {NoteHomePageConstants} from './note-home-page.constants';

import './note-home-page.component.css';

@Component({
  selector: 'oppia-note-home-page',
  templateUrl: './note-home-page.component.html',
})
export class NoteHomePageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE!: number;
  MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE_SEARCH!: number;
  searchBarPlaceholder!: string;
  lastPostOnPageNum!: number;
  totalNotes!: number;
  noResultsFound!: boolean;
  oppiaAvatarImgUrl!: string;
  searchQuery: string = '';
  activeMenuName: string = '';
  searchButtonIsActive: boolean = false;
  searchQueryChanged: Subject<string> = new Subject<string>();
  showNoteCardsLoadingScreen: boolean = false;
  noteSummaries: NoteSummary[] = [];
  noteSummariesToShow: NoteSummary[] = [];
  page: number = 1;
  searchPageIsActive: boolean = false;
  directiveSubscriptions = new Subscription();
  firstPostOnPageNum: number = 1;
  searchOffset: number | null = 0;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
    private noteSearchService: NotePostSearchService,
    private noteHomePageBackendApiService: NoteHomePageBackendApiService,
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.oppiaAvatarImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_avatar_100px.svg'
    );
    this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE =
      NoteHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE;
    this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE_SEARCH =
      NoteHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_SEARCH_RESULTS_PAGE;
    if (this.urlService.getUrlParams().hasOwnProperty('q')) {
      this.searchPageIsActive = true;
      this.updateSearchFieldsBasedOnUrlQuery();
    } else {
      this.loadInitialNoteHomePageData();
    }
    this.searchQueryChanged
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(model => {
        this.searchQuery = model;
        this.onSearchQueryChangeExec();
      });

    // Notify the function that handles overflow in case the
    // search elements load after it has already been run.
    this.noteSearchService.onSearchBarLoaded.emit();

    // Called when the first batch of search results is retrieved from
    // the server.
    this.directiveSubscriptions.add(
      this.noteSearchService.onInitialSearchResultsLoaded.subscribe(
        (response: SearchResponseData) => {
          this.noteSummaries = [];
          this.page = 1;
          this.firstPostOnPageNum = 1;
          if (response.noteSummariesList.length > 0) {
            this.noResultsFound = false;
            this.loadSearchResultsPageData(response);
          } else {
            this.noResultsFound = true;
          }
          this.loaderService.hideLoadingScreen();
        }
      )
    );
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticAssetUrl(imagePath);
  }

  loadSearchResultsPageData(data: SearchResponseData): void {
    this.noteSummaries = this.noteSummaries.concat(data.noteSummariesList);
    this.searchOffset = data.searchOffset;
    if (this.searchOffset) {
      // As search offset is not null, there are more search result pages to
      // load. Therefore for pagination to show that more results are available,
      // total number of notes is one more than the number of notes loaded
      // as number of pages is automatically calculated using total
      // collection size and number of notes to show on a page.
      this.totalNotes = this.noteSummaries.length + 1;
    } else {
      this.totalNotes = this.noteSummaries.length;
    }
    this.calculateLastPostOnPageNum(
      this.page,
      this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE_SEARCH
    );
    this.selectNoteSummariesToShow();
    this.showNoteCardsLoadingScreen = false;
    this.loaderService.hideLoadingScreen();
  }

  loadInitialNoteHomePageData(): void {
    this.noteHomePageBackendApiService.fetchNoteHomePageDataAsync('0').then(
      (data: NoteHomePageData) => {
        if (data.numOfPublishedNotes) {
          this.totalNotes = data.numOfPublishedNotes;
          this.noResultsFound = false;
          this.noteSummaries = data.noteSummaryDicts;
          this.noteSummariesToShow = this.noteSummaries;
          this.calculateLastPostOnPageNum(
            this.page,
            this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE
          );
        } else {
          this.noResultsFound = true;
        }
        this.loaderService.hideLoadingScreen();
      },
      errorResponse => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1
        ) {
          this.alertsService.addWarning(
            'Failed to get note home page data.Error: ' +
              `${errorResponse.error.error}`
          );
        }
      }
    );
  }

  loadMoreNoteSummaries(offset: number): void {
    this.noteHomePageBackendApiService
      .fetchNoteHomePageDataAsync(String(offset))
      .then(
        (data: NoteHomePageData) => {
          this.noteSummaries = this.noteSummaries.concat(data.noteSummaryDicts);
          this.selectNoteSummariesToShow();
          this.calculateLastPostOnPageNum(
            this.page,
            this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE
          );
          this.showNoteCardsLoadingScreen = false;
        },
        errorResponse => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1
          ) {
            this.alertsService.addWarning(
              'Failed to get note home page data.Error:' +
                ` ${errorResponse.error.error}`
            );
          }
        }
      );
  }

  loadPage(): void {
    if (this.noteSummaries.length < this.firstPostOnPageNum) {
      this.showNoteCardsLoadingScreen = true;
      if (!this.searchPageIsActive) {
        this.loadMoreNoteSummaries(this.firstPostOnPageNum - 1);
      } else {
        this.noteSearchService.loadMoreData(
          data => {
            this.loadSearchResultsPageData(data);
          },
          _isCurrentlyFetchingResults => {
            this.alertsService.addWarning(
              'No more search resutls found. End of search results.'
            );
          }
        );
      }
    } else {
      this.selectNoteSummariesToShow();
    }
  }

  onPageChange(page = this.page): void {
    if (!this.searchPageIsActive) {
      this.calculateFirstPostOnPageNum(
        page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE
      );
      this.calculateLastPostOnPageNum(
        page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE
      );
      this.loadPage();
    } else {
      this.calculateFirstPostOnPageNum(
        page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE_SEARCH
      );
      this.calculateLastPostOnPageNum(
        page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE_SEARCH
      );
      this.loadPage();
    }
  }

  selectNoteSummariesToShow(): void {
    this.noteSummariesToShow = this.noteSummaries.slice(
      this.firstPostOnPageNum - 1,
      this.lastPostOnPageNum
    );
  }

  calculateFirstPostOnPageNum(pageNum: number, pageSize: number): void {
    this.firstPostOnPageNum = (pageNum - 1) * pageSize + 1;
  }

  calculateLastPostOnPageNum(pageNum: number, pageSize: number): void {
    this.lastPostOnPageNum = Math.min(pageNum * pageSize, this.totalNotes);
  }

  isSearchInProgress(): boolean {
    return false;
  }

  searchToBeExec(e: {target: {value: string}}): void {
    if (!this.searchButtonIsActive) {
      this.searchQueryChanged.next(e.target.value);
    }
  }

  onSearchQueryChangeExec(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.noteSearchService.executeSearchQuery(
      this.searchQuery,
      () => {
        let searchUrlQueryString =
          this.noteSearchService.getSearchUrlQueryString(this.searchQuery);
        let url = new URL(this.windowRef.nativeWindow.location.toString());
        let siteLangCode: string | null = url.searchParams.get('lang');
        url.search = '?q=' + searchUrlQueryString;
        if (
          this.windowRef.nativeWindow.location.pathname === '/note/search/find'
        ) {
          if (siteLangCode) {
            url.searchParams.append('lang', siteLangCode);
          }
          this.windowRef.nativeWindow.history.pushState({}, '', url.toString());
        } else {
          url.pathname = 'note/search/find';
          if (siteLangCode) {
            url.searchParams.append('lang', siteLangCode);
          }
          this.windowRef.nativeWindow.location.href = url.toString();
        }
      },
      errorResponse => {
        this.alertsService.addWarning(
          `Unable to fetch search results.Error: ${errorResponse}`
        );
      }
    );
  }

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 1024;
  }

  updateSearchFieldsBasedOnUrlQuery(): void {
    let newSearchQuery: UrlSearchQuery;
    newSearchQuery = this.noteSearchService.updateSearchFieldsBasedOnUrlQuery(
      this.windowRef.nativeWindow.location.search
    );

    if (this.searchQuery !== newSearchQuery.searchQuery) {
      this.searchQuery = newSearchQuery.searchQuery;
      this.onSearchQueryChangeExec();
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
