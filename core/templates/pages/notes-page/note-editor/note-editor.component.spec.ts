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
 * @fileoverview Unit tests for blog post editor.
 */

import {ElementRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCardModule} from '@angular/material/card';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {MaterialModule} from 'modules/material.module';
import {NotesPageService} from 'pages/notes-page/services/notes-page.service';
import {NoteEditorComponent} from './note-editor.component';
import {NoteEditorBackendApiService} from 'domain/note/note-editor-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {AlertsService} from 'services/alerts.service';
import {MockTranslatePipe, MockCapitalizePipe} from 'tests/unit-test-utils';
import {NoteData} from 'domain/note/note.model';
import {UrlService} from 'services/contextual/url.service';
import {NoteUpdateService} from 'domain/note/note-update.service';
import {FormsModule} from '@angular/forms';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';
import {UserInfo} from 'domain/user/user-info.model';

describe('Note Editor Component', () => {
  let fixture: ComponentFixture<NoteEditorComponent>;
  let component: NoteEditorComponent;
  let notePageService: NotesPageService;
  let noteUpdateService: NoteUpdateService;
  let loaderService: LoaderService;
  let noteEditorBackendApiService: NoteEditorBackendApiService;
  let urlService: UrlService;
  let sampleNoteData: NoteData;
  let windowDimensionsService: WindowDimensionsService;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let userService: UserService;

  let sampleNoteBackendDict = {
    id: 'sampleBlogId',
    displayed_author_name: 'test_user',
    title: 'sample title',
    subtitle: '',
    content: '<p>hello</p>',
    url_fragment: 'sample#url',
    last_updated: '11/21/2014, 04:52:46:713463',
    published_on: '11/21/2014, 04:52:46:713463',
  };

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        reload: () => {},
      },
      sessionStorage: {
        clear: () => {},
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatButtonToggleModule,
        MaterialModule,
        MatCardModule,
        FormsModule,
      ],
      declarations: [NoteEditorComponent, MockTranslatePipe],
      providers: [
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
            getResizeEvent() {
              return {
                subscribe: (callb: () => void) => {
                  callb();
                  return {
                    unsubscribe() {},
                  };
                },
              };
            },
          },
        },
        PreventPageUnloadEventService,
        NotesPageService,
        NoteUpdateService,
        NoteEditorBackendApiService,
        LoaderService,
        AlertsService,
        UrlService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteEditorComponent);
    component = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    notePageService = TestBed.inject(NotesPageService);
    loaderService = TestBed.inject(LoaderService);
    noteEditorBackendApiService = TestBed.inject(NoteEditorBackendApiService);
    noteUpdateService = TestBed.inject(NoteUpdateService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService
    );
    userService = TestBed.inject(UserService);
    sampleNoteData = NoteData.createFromBackendDict(sampleNoteBackendDict);
    spyOn(urlService, 'getNoteIdFromUrl').and.returnValue('sampleBlogId');
    spyOn(preventPageUnloadEventService, 'addListener');
    spyOn(preventPageUnloadEventService, 'removeListener');
    component.ngOnInit();
    component.titleInput = new ElementRef(document.createElement('div'));
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
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
    spyOn(component, 'initEditor');
    spyOn(windowDimensionsService, 'isWindowNarrow').and.callThrough();
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(sampleUserInfo)
    );

    component.ngOnInit();
    tick();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(component.noteId).toEqual('');
    expect(component.initEditor).toHaveBeenCalled;
    expect(windowDimensionsService.isWindowNarrow).toHaveBeenCalled();
    expect(component.windowIsNarrow).toBe(true);
    expect(loaderService.hideLoadingScreen).not.toHaveBeenCalled();
  }));

  it('should successfully fetch blog post editor data', fakeAsync(() => {
    let noteEditorData = {
      displayedAuthorName: 'test_user',
      noteDict: sampleNoteData,
    };
    component.noteId = 'sampleBlogId';
    component.titleEditorIsActive = false;
    spyOn(noteEditorBackendApiService, 'fetchNoteEditorData').and.returnValue(
      Promise.resolve(noteEditorData)
    );

    component.initEditor();
    tick();

    expect(noteEditorBackendApiService.fetchNoteEditorData).toHaveBeenCalled();
    expect(component.authorName).toEqual('test_user');
    expect(component.noteData).toEqual(sampleNoteData);
    expect(notePageService.imageUploaderIsNarrow).toBeTrue();
    expect(component.dateTimeLastSaved).toEqual(
      'November 21, 2014 at 04:52 AM'
    );
    expect(component.title).toEqual('sample title');
    expect(component.contentEditorIsActive).toBeFalse();
    expect(component.lastChangesWerePublished).toBeTrue();
    expect(component.titleEditorIsActive).toBeFalse();
    expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
  }));

  it('should update local content value', fakeAsync(() => {
    spyOn(noteUpdateService, 'setNoteContent');
    component.localEditedContent = '<p>Sample content changed</p>';

    component.noteData = sampleNoteData;
    component.updateContentValue();
    tick();

    expect(noteUpdateService.setNoteContent).toHaveBeenCalledWith(
      sampleNoteData,
      '<p>Sample content changed</p>'
    );
    expect(component.contentEditorIsActive).toBe(false);
    expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
  }));

  it('should cancel edit of blog post content and should close RTE', () => {
    component.noteData = sampleNoteData;
    component.contentEditorIsActive = true;

    component.cancelEdit();

    expect(component.contentEditorIsActive).toBe(false);
  });

  it(
    'should cancel edit of blog post content and should not' +
      ' close RTE if content is empty',
    () => {
      component.noteData = sampleNoteData;
      component.noteData.content = '';
      component.contentEditorIsActive = true;

      component.cancelEdit();

      expect(component.contentEditorIsActive).toBe(true);
    }
  );
});
