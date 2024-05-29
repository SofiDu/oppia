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
 * @fileoverview Unit tests for Notes Card component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {MockTranslatePipe, MockCapitalizePipe} from 'tests/unit-test-utils';
import {NotesCardComponent} from './notes-card.component';
import {
  NotesPostSummaryBackendDict,
  NotesPostSummary,
} from 'domain/notes/notes-post-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ContextService} from 'services/context.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';

describe('Notes Page Tile Component', () => {
  let component: NotesCardComponent;
  let fixture: ComponentFixture<NotesCardComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let contextService: ContextService;
  let sampleNotesPostSummary: NotesPostSummaryBackendDict;
  let userService: UserService;
  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        reload: () => {},
      },
    };
  }
  let mockWindowRef: MockWindowRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [NotesCardComponent, MockTranslatePipe],
      providers: [
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        UrlInterpolationService,
        ContextService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesCardComponent);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    contextService = TestBed.inject(ContextService);
    component = fixture.componentInstance;
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    userService = TestBed.inject(UserService);
    sampleNotesPostSummary = {
      id: 'sampleId',
      author_username: 'test_username',
      displayed_author_name: 'test_user',
      title: 'Title',
      subtitle: 'Subtitle',
      summary: 'Hello World',
      url_fragment: 'title',
      last_updated: '11/21/2014',
      published_on: '11/21/2014',
    };
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should get formatted date string from the timestamp in milliseconds', () => {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    let DATE = '11/21/2014';
    expect(component.getDateStringInWords(DATE)).toBe('November 21, 2014');

    DATE = '01/16/2027';
    expect(component.getDateStringInWords(DATE)).toBe('January 16, 2027');

    DATE = '02/02/2018';
    expect(component.getDateStringInWords(DATE)).toBe('February 2, 2018');
  });

  it('should initialize', () => {
    component.notesPostSummary = NotesPostSummary.createFromBackendDict(
      sampleNotesPostSummary
    );
    spyOn(contextService, 'isInNotesPostEditorPage').and.returnValue(true);

    component.ngOnInit();

    expect(component.publishedDateString).toBe('November 21, 2014');
    expect(component.notesCardPreviewModeIsActive).toBeTrue();
  });

  it('should throw error if published date is not defined', () => {
    const invalidNotesPostSummary: NotesPostSummaryBackendDict = {
      id: 'sampleId',
      author_username: 'test_username',
      displayed_author_name: 'test_user',
      title: 'Title',
      subtitle: 'Subtitle',
      summary: 'Hello World',
      url_fragment: 'title',
      last_updated: '11/21/2014',
    };
    component.notesPostSummary = NotesPostSummary.createFromBackendDict(
      invalidNotesPostSummary
    );

    expect(() => {
      component.ngOnInit();
    }).toThrowError('Notes Post Summary published date is not defined');
  });

  it('should navigate to the notes post page', () => {
    component.notesPostSummary = NotesPostSummary.createFromBackendDict(
      sampleNotesPostSummary
    );
    spyOn(contextService, 'isInNotesPostEditorPage').and.returnValue(false);
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/notes/sample-notes-post-url'
    );

    component.navigateToNotesPostPage();

    expect(mockWindowRef.nativeWindow.location.href).toEqual(
      '/notes/sample-notes-post-url'
    );
  });
});
