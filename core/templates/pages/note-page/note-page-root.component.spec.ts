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
 * @fileoverview Unit tests for the note home page root component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';

import {
  NoteHomePageBackendApiService,
  NotePageData,
} from 'domain/note/note-homepage-backend-api.service';

import {NoteBackendDict, NoteData} from 'domain/note/note.model';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {LoaderService} from 'services/loader.service';
import {PageHeadService} from 'services/page-head.service';
import {PageTitleService} from 'services/page-title.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NotePageRootComponent} from './note-page-root.component';
import {UserService} from 'services/user.service';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

describe('Note Page Root', () => {
  let fixture: ComponentFixture<NotePageRootComponent>;
  let component: NotePageRootComponent;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let loaderService: LoaderService;
  let urlService: UrlService;
  let noteHomePageBackendApiService: NoteHomePageBackendApiService;
  let sampleNotePost: NoteData;
  let userService: UserService;
  let sampleNoteBackendDict: NoteBackendDict = {
    id: 'sampleId',
    displayed_author_name: 'testUsername',
    title: 'sampleTitle',
    subtitle: 'sampleSubtitle',
    content: '<p>Hello</p>',
    url_fragment: 'sample-post',
    last_updated: '3454354354',
    published_on: '3454354354',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [NotePageRootComponent, MockTranslatePipe],
      providers: [
        PageHeadService,
        UrlService,
        UserService,
        PageTitleService,
        NoteHomePageBackendApiService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotePageRootComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    pageHeadService = TestBed.inject(PageHeadService);
    pageTitleService = TestBed.inject(PageTitleService);
    noteHomePageBackendApiService = TestBed.inject(
      NoteHomePageBackendApiService
    );
    loaderService = TestBed.inject(LoaderService);
    urlService = TestBed.inject(UrlService);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    translateService = TestBed.inject(TranslateService);
    sampleNotePost = NoteData.createFromBackendDict(sampleNoteBackendDict);
    userService = TestBed.inject(UserService);
    spyOn(urlService, 'getNotePostUrlFromUrl').and.returnValue('sample-post');
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it(
    'should initialize and show page when access is valid and note project' +
      ' feature is enabled',
    fakeAsync(() => {
      spyOn(userService, 'canUserEditNotePosts').and.returnValue(
        Promise.resolve(false)
      );
      spyOn(
        accessValidationBackendApiService,
        'validateAccessToNotePostPage'
      ).and.returnValue(Promise.resolve());
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(loaderService, 'hideLoadingScreen');
      spyOn(component, 'fetchNoteData');

      component.ngOnInit();
      tick();
      tick();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(component.noteUrlFragment).toBe('sample-post');
      expect(
        accessValidationBackendApiService.validateAccessToNotePage
      ).toHaveBeenCalled();
      expect(component.fetchNoteData).toHaveBeenCalledWith('sample-post');
      expect(component.errorPageIsShown).toBeFalse();
      expect(loaderService.hideLoadingScreen).not.toHaveBeenCalled();
    })
  );

  it('should successfully load fetch note post data from backend', fakeAsync(() => {
    let sampleNotePageData: NotePageData = {
      authorUsername: 'test_username',
      noteDict: sampleNotePost,
      summaryDicts: [],
    };
    spyOn(
      noteHomePageBackendApiService,
      'fetchNotePageDataAsync'
    ).and.returnValue(Promise.resolve(sampleNotePageData));
    spyOn(component, 'setPageTitle');
    spyOn(loaderService, 'hideLoadingScreen');

    component.fetchNoteData('sample-post');

    expect(
      noteHomePageBackendApiService.fetchNotePageDataAsync
    ).toHaveBeenCalledWith('sample-post');

    tick();

    expect(component.note).toEqual(sampleNotePost);
    expect(component.notePageData).toEqual(sampleNotePageData);
    expect(component.setPageTitle).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));
});
