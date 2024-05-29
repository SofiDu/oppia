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
 * @fileoverview Unit Tests for Notes Page service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {NoteEditorBackendApiService} from 'domain/note/note-editor-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NotesPageService} from './notes-page.service';
import {NoteData} from 'domain/note/note.model';

describe('Notes Post Page service', () => {
  let alertsService: AlertsService;
  let notesPageService: NotesPageService;
  let notesPostEditorBackendApiService: NoteEditorBackendApiService;
  let mockWindowRef: MockWindowRef;
  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        reload: () => {},
      },
      open: (url: string) => {},
      onhashchange() {},
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NoteEditorBackendApiService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    notesPostEditorBackendApiService = TestBed.inject(
      NoteEditorBackendApiService
    );
    notesPageService = TestBed.inject(NotesPageService);
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    alertsService = TestBed.inject(AlertsService);
  });

  it('should set the default active tab name', () => {
    expect(notesPageService.activeTab).toEqual('main');
  });

  it('should navigate to different tabs', () => {
    expect(notesPageService.activeTab).toEqual('main');

    notesPageService.navigateToEditorTabWithId('sampleId1234');
    mockWindowRef.nativeWindow.onhashchange();

    expect(notesPageService.activeTab).toEqual('editor_tab');

    notesPageService.navigateToMainTab();

    expect(mockWindowRef.nativeWindow.location.href).toBe('/notes');
  });

  it('should handle calls with unexpect paths', () => {
    expect(notesPageService.activeTab).toEqual('main');

    mockWindowRef.nativeWindow.location.hash = '';
    expect(notesPageService.activeTab).toEqual('main');
  });

  it('should set and retrieve notes post action correctly', () => {
    notesPageService.notesPostAction = 'delete';

    expect(notesPageService.notesPostAction).toEqual('delete');
  });

  it('should set and retrieve imageUploaderIsNarrow property', () => {
    notesPageService.imageUploaderIsNarrow = true;

    expect(notesPageService.imageUploaderIsNarrow).toEqual(true);

    notesPageService.imageUploaderIsNarrow = false;

    expect(notesPageService.imageUploaderIsNarrow).toEqual(false);
  });

  it('should display alert when unable to delete notes post data', fakeAsync(() => {
    spyOn(
      notesPostEditorBackendApiService,
      'deleteNotesPostAsync'
    ).and.returnValue(Promise.reject({status: 500}));
    spyOn(alertsService, 'addWarning');

    notesPageService.deleteNotesPost();
    tick();

    expect(notesPostEditorBackendApiService.deleteNoteAsync).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to delete notes post.'
    );
  }));

  it('should successfully delete notes post data from notes post editor', fakeAsync(() => {
    // Setting active tab as notes post editor.
    notesPageService.navigateToEditorTabWithId('sampleId1234');
    mockWindowRef.nativeWindow.onhashchange();
    spyOn(
      notesPostEditorBackendApiService,
      'deleteNotesPostAsync'
    ).and.returnValue(Promise.resolve(200));
    spyOn(alertsService, 'addSuccessMessage');

    notesPageService.deleteNotesPost();
    tick();

    expect(notesPostEditorBackendApiService.deleteNoteAsync).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Notes Post Deleted Successfully.',
      5000
    );
    expect(notesPageService.activeTab).toBe('editor_tab');
  }));

  it('should successfully delete notes post data from page', fakeAsync(() => {
    spyOn(
      notesPostEditorBackendApiService,
      'deleteNotesPostAsync'
    ).and.returnValue(Promise.resolve(200));
    spyOn(notesPageService, 'navigateToMainTab');
    spyOn(alertsService, 'addSuccessMessage');

    notesPageService.deleteNotesPost();
    tick();

    expect(notesPostEditorBackendApiService.deleteNoteAsync).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Notes Post Deleted Successfully.',
      5000
    );
    expect(notesPageService.navigateToMainTab).not.toHaveBeenCalled();
  }));

  it('should succesfully set the notes post title in navbar', fakeAsync(() => {
    spyOn(notesPageService.updateNavTitleEventEmitter, 'emit');

    notesPageService.setNavTitle(false, '');
    tick();

    expect(
      notesPageService.updateNavTitleEventEmitter.emit
    ).toHaveBeenCalledWith('New Post - Untitled');

    notesPageService.setNavTitle(false, 'Sample Title');
    tick();

    expect(
      notesPageService.updateNavTitleEventEmitter.emit
    ).toHaveBeenCalledWith('Draft - Sample Title');

    notesPageService.setNavTitle(true, 'Sample Title');
    tick();

    expect(
      notesPageService.updateNavTitleEventEmitter.emit
    ).toHaveBeenCalledWith('Published - Sample Title');
  }));

  it('should set and retrieve notesPostId correctly', () => {
    notesPageService.notesPostId = 'abc123456abc';

    expect(notesPageService.notesPostId).toEqual('abc123456abc');
  });

  it('should set and retrieve notes post data correctly', () => {
    let summaryObject = NoteData.createFromBackendDict({
      id: 'sampleId',
      displayed_author_name: 'test_user',
      title: 'Title',
      subtitle: 'Subtitle',
      content: 'Hello World',
      url_fragment: 'title',
      last_updated: '3232323',
      published_on: '3232323',
    });

    notesPageService.notesPostData = summaryObject;

    expect(notesPageService.notesPostData).toEqual(summaryObject);
  });
});
