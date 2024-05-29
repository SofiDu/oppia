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
 * @fileoverview Unit tests for Note Home Page Component.
 */

import {EventEmitter, Pipe} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MaterialModule} from 'modules/material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NoteHomePageComponent} from 'pages/note-home-page/note-home-page.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {
  NotePostSearchService,
  UrlSearchQuery,
} from 'services/note-search.service';
import {
  NoteHomePageBackendApiService,
  SearchResponseData,
} from 'domain/note/note-homepage-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {Subject} from 'rxjs/internal/Subject';
import {NotesCardComponent} from 'pages/notes-page/notes-card/notes-card.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  NoteSummary,
  NoteSummaryBackendDict,
} from 'domain/note/note-summary.model';
import {AlertsService} from 'services/alerts.service';
// This throws "TS2307". We need to
// suppress this error because rte-text-components are not strictly typed yet.
// @ts-ignore
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: 'note/search/find',
      href: '',
      toString() {
        return 'http://localhost/test_path';
      },
    },
    history: {
      pushState(data: object, title: string, url?: string | null) {},
    },
  };
}

class MockWindowDimensionsService {
  getWidth(): number {
    return 766;
  }
}

describe('Note home page component', () => {
  let searchService: NotePostSearchService;
  let alertsService: AlertsService;
  let windowDimensionsService: WindowDimensionsService;
  let urlService: UrlService;
  let loaderService: LoaderService;
  let urlInterpolationService: UrlInterpolationService;
  let NoteSummaryObject: NoteSummary;
  let searchResponseData: SearchResponseData;
  let component: NoteHomePageComponent;
  let fixture: ComponentFixture<NoteHomePageComponent>;
  let mockOnInitialSearchResultsLoaded = new EventEmitter<SearchResponseData>();

  let NoteSummary: NoteSummaryBackendDict = {
    id: 'sampleNoteId',
    author_username: 'test_username',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    subtitle: 'sample_subtitle',
    summary: 'hello',
    url_fragment: 'sample#url',
    last_updated: '3232323',
    published_on: '1212121',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule,
        MaterialModule,
        RichTextComponentsModule,
      ],
      declarations: [
        NoteHomePageComponent,
        NotesCardComponent,
        MockTranslatePipe,
        MockTruncatePipe,
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
        LoaderService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteHomePageComponent);
    component = fixture.componentInstance;
    searchService = TestBed.inject(NotePostSearchService);
    alertsService = TestBed.inject(AlertsService);
    noteHomePageBackendApiService = TestBed.inject(
      NoteHomePageBackendApiService
    );
    windowRef = TestBed.inject(WindowRef);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    urlService = TestBed.inject(UrlService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    loaderService = TestBed.inject(LoaderService);
    NoteSummaryObject = NoteSummary.createFromBackendDict(NoteSummary);
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
  });

  it('should determine if small screen view is active', () => {
    const windowWidthSpy = spyOn(
      windowDimensionsService,
      'getWidth'
    ).and.returnValue(766);
    expect(component.isSmallScreenViewActive()).toBe(true);
    windowWidthSpy.and.returnValue(1028);
    expect(component.isSmallScreenViewActive()).toBe(false);
  });

  it('should update search fields based on url query for new query', () => {
    let searchQuery: UrlSearchQuery = {
      searchQuery: 'search_query',
    };
    spyOn(searchService, 'updateSearchFieldsBasedOnUrlQuery').and.returnValue(
      searchQuery
    );
    spyOn(component, 'onSearchQueryChangeExec');
    expect(component.searchQuery).toEqual('');

    component.updateSearchFieldsBasedOnUrlQuery();

    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
    expect(component.searchQuery).toBe('search_query');
  });

  it('should execute search when search query changes', () => {
    spyOn(component, 'onSearchQueryChangeExec');
    spyOn(component, 'loadInitialNoteHomePageData');
    spyOn(component, 'updateSearchFieldsBasedOnUrlQuery');
    spyOn(urlService, 'getUrlParams').and.returnValue({});

    component.searchQueryChanged = {
      pipe: (param1: string, parm2: string) => {
        return {
          subscribe(callb: () => void) {
            callb();
          },
        };
      },
    } as Subject<string>;
    component.ngOnInit();

    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
    expect(component.loadInitialNoteHomePageData).toHaveBeenCalled();
    expect(component.searchPageIsActive).toBeFalse();
    expect(component.updateSearchFieldsBasedOnUrlQuery).not.toHaveBeenCalled();
  });

  describe(' when loading search results page', () => {
    beforeEach(() => {
      spyOn(urlService, 'getUrlParams').and.returnValue({q: 'search_query'});
      spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
        'image_url'
      );
      spyOnProperty(
        searchService,
        'onInitialSearchResultsLoaded'
      ).and.returnValue(mockOnInitialSearchResultsLoaded);
      spyOn(component, 'onSearchQueryChangeExec');
      spyOn(component, 'updateSearchFieldsBasedOnUrlQuery');
      searchResponseData = {
        searchOffset: null,
        notePostSummariesList: [],
        listOfDefaultTags: ['learners', 'news'],
      };
    });

    it('should initialize', () => {
      spyOn(component, 'loadInitialNoteHomePageData');

      component.ngOnInit();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(component.oppiaAvatarImgUrl).toBe('image_url');
      expect(component.loadInitialNoteHomePageData).not.toHaveBeenCalled();
      expect(component.onSearchQueryChangeExec).not.toHaveBeenCalled();
      expect(component.searchPageIsActive).toBeTrue();
      expect(component.updateSearchFieldsBasedOnUrlQuery).toHaveBeenCalled();
      expect(searchService.onSearchBarLoaded.emit).toHaveBeenCalled();
      expect(
        searchService.onInitialSearchResultsLoaded.subscribe
      ).toHaveBeenCalled();
      expect(urlService.getUrlParams).toHaveBeenCalled();
    });

    it('should succesfully load multiple search results pages data', fakeAsync(() => {
      searchResponseData.searchOffset = 1;
      searchResponseData.noteSummariesList = [
        NoteSummaryObject,
        NoteSummaryObject,
      ];
      spyOn(alertsService, 'addWarning');
      spyOn(searchService, 'loadMoreData').and.callFake(
        (callb: (SearchResponseData: SearchResponseData) => void) => {
          callb(searchResponseData);
        }
      );
      component.ngOnInit();

      // Loading page 1.
      mockOnInitialSearchResultsLoaded.emit(searchResponseData);
      tick();

      expect(component.noteSummaries.length).toBe(2);
      expect(component.searchOffset).toEqual(1);
      expect(component.noteSummariesToShow).toEqual([
        NoteSummaryObject,
        NoteSummaryObject,
      ]);
      expect(component.noteSummariesToShow.length).toBe(2);
      expect(component.lastPostOnPageNum).toBe(2);

      // Changing to page 2.
      component.page = 2;
      component.onPageChange();
      tick();

      expect(component.firstPostOnPageNum).toBe(3);
      expect(component.noteSummaries.length).toBe(4);
      expect(component.noteSummariesToShow.length).toBe(2);
      expect(component.lastPostOnPageNum).toBe(4);

      // Changing back to page 1.
      component.page = 1;
      component.onPageChange();

      expect(component.firstPostOnPageNum).toBe(1);
      expect(component.noteSummaries.length).toBe(4);
      expect(component.noteSummariesToShow.length).toBe(2);
      expect(component.lastPostOnPageNum).toBe(2);

      expect(alertsService.addWarning).not.toHaveBeenCalled();
    }));
  });
});
