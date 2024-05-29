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
 * @fileoverview Unit tests for Notes page component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {MatTabsModule} from '@angular/material/tabs';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {MockTranslatePipe, MockCapitalizePipe} from 'tests/unit-test-utils';
import {NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {LoaderService} from 'services/loader.service';
import {AlertsService} from 'services/alerts.service';
import {NoteBackendApiService} from 'domain/note/note-page-backend-api.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NotesPageService} from './services/notes-page.service';
import {NotesPageComponent} from './notes-page.component';
import {NoteSummary} from 'domain/note/note-summary.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {of} from 'rxjs';
import {UserService} from 'services/user.service';
import {UserInfo} from 'domain/user/user-info.model';

describe('Notes Page Component', () => {
  let notesBackendApiService: NoteBackendApiService;
  let notesPageService: NotesPageService;
  let component: NotesPageComponent;
  let fixture: ComponentFixture<NotesPageComponent>;
  let loaderService: LoaderService;
  let mockWindowRef: MockWindowRef;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEvent = new Event('resize');
  let userService: UserService;
  let noteData = {
    displayedAuthorName: 'test_user',
    numOfPublishedNotes: 0,
    numOfDraftNotes: 0,
    publishedNoteSummaryDicts: [],
    draftNoteSummaryDicts: [],
  };

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        _hashChange: null,
        reload: () => {},
      },
      open: (url: string) => {},
      onhashchange() {
        return this.location._hashChange;
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatTabsModule, NgbModalModule],
      declarations: [NotesPageComponent, MockTranslatePipe],
      providers: [
        AlertsService,
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent),
          },
        },
        NoteBackendApiService,
        NotesPageService,
        LoaderService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesPageComponent);
    component = fixture.componentInstance;
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    notesPageService = TestBed.inject(NotesPageService);
    loaderService = TestBed.inject(LoaderService);
    notesBackendApiService = TestBed.inject(NoteBackendApiService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    userService = TestBed.inject(UserService);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it(
    'should set correct activeTab value when update view ' +
      'event is emitted.',
    fakeAsync(() => {
      component.ngOnInit();

      expect(component.activeTab).toBe('main');

      // Changing active tab to notes post editor.
      notesPageService.navigateToEditorTabWithId('123456sample');
      mockWindowRef.nativeWindow.onhashchange();
      tick();

      expect(component.activeTab).toBe('editor_tab');

      // Changing active tab back to main tab.
      mockWindowRef.nativeWindow.location.hash = '/';
      mockWindowRef.nativeWindow.onhashchange();
      tick();

      expect(component.activeTab).toBe('main');
    })
  );

  it('should call initMainTab if active tab is main', () => {
    spyOn(component, 'initMainTab');
    component.ngOnInit();

    expect(component.activeTab).toBe('main');
    expect(component.initMainTab).toHaveBeenCalled();
  });

  it('should not call initMainTab if active tab is editor_tab', fakeAsync(() => {
    spyOn(component, 'initMainTab');
    // Changing active tab to notes post editor.
    notesPageService.navigateToEditorTabWithId('123456sample');
    mockWindowRef.nativeWindow.onhashchange();

    component.ngOnInit();
    tick();

    expect(component.activeTab).toBe('editor_tab');
    expect(component.initMainTab).not.toHaveBeenCalled();
  }));

  it('should initialize main tab', fakeAsync(() => {
    const sampleUserInfoBackendObject = {
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: true,
    };
    const sampleUserInfo = UserInfo.createFromBackendDict(
      sampleUserInfoBackendObject
    );
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(notesBackendApiService, 'fetchnoteDataAsync').and.returnValue(
      Promise.resolve(noteData)
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(sampleUserInfo)
    );

    component.initMainTab();
    // As loading screen should be shown irrespective of the response
    // of the async call, expect statement is before tick().
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();

    tick();

    expect(component.noteData).toEqual(noteData);
    expect(notesBackendApiService.fetchNoteDataAsync).toHaveBeenCalled();
    expect(component.showAuthorDetailsEditor).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(windowDimensionsService.isWindowNarrow()).toHaveBeenCalled;
    expect(component.windowIsNarrow).toBe(true);
  }));

  it(
    'should remove unpublish notes post from published list and' +
      ' add it to drafts list',
    () => {
      let summaryObject = NoteSummary.createFromBackendDict({
        id: 'sampleId',
        author_username: 'test_username',
        displayed_author_name: 'test_user',
        title: 'Title',
        subtitle: 'Subtitle',
        summary: 'Hello World',
        url_fragment: 'title',
        last_updated: '3232323',
        published_on: '3232323',
      });
      let notesData = {
        displayedAuthorName: 'test_user',
        authorBio: 'bio',
        numOfPublishedNotesPosts: 1,
        numOfDraftNotesPosts: 0,
        publishedNoteSummaryDicts: [summaryObject],
        draftNoteSummaryDicts: [],
      };
      component.noteData = notesData;

      component.unpublishedNotesPost(summaryObject);

      // NoteSummary should now be a part of draft list whereas
      // publish NoteSummary list should be empty.
      expect(component.noteData.draftNoteSummaryDicts).toEqual([summaryObject]);
      expect(component.noteData.publishedNoteSummaryDicts).toEqual([]);
      expect(component.noteData.numOfPublishedNotes).toEqual(0);
      expect(component.noteData.numOfDraftNotes).toEqual(1);
    }
  );

  it(
    'should successfully remove notes post summary when notes post' +
      'draft notes post is deleted',
    () => {
      let summaryObject = NoteSummary.createFromBackendDict({
        id: 'sampleId',
        author_username: 'test_username',
        displayed_author_name: 'test_user',
        title: 'Title',
        subtitle: 'Subtitle',
        summary: 'Hello World',
        url_fragment: 'title',
        last_updated: '3232323',
        published_on: '3232323',
      });
      let notesData = {
        displayedAuthorName: 'test_user',
        numOfPublishedNotesPosts: 0,
        numOfDraftNotesPosts: 0,
        publishedNoteSummaryDicts: [],
        draftNoteSummaryDicts: [summaryObject],
      };
      component.noteData = notesData;

      component.removeNotesPost(summaryObject, false);

      expect(component.noteData.draftNoteSummaryDicts).toEqual([]);
    }
  );
});
