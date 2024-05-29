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
 * @fileoverview Unit tests for Notes Page Tile component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {MockTranslatePipe, MockCapitalizePipe} from 'tests/unit-test-utils';
import {NotesTileComponent} from './notes-tile.component';
import {NoteSummary} from 'domain/note/note-summary.model';
import {MatCardModule} from '@angular/material/card';
import {MatMenuModule} from '@angular/material/menu';
import {NotesPageService} from '../services/notes-page.service';
import {NoteEditorBackendApiService} from 'domain/note/note-editor-backend-api.service';
import {NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {AlertsService} from 'services/alerts.service';

describe('Notes Page Tile Component', () => {
  let component: NotesTileComponent;
  let fixture: ComponentFixture<NotesTileComponent>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatCardModule,
        MatMenuModule,
        NgbModalModule,
      ],
      declarations: [NotesTileComponent, MockTranslatePipe],
      providers: [
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe,
        },
        NotesPageService,
        NoteEditorBackendApiService,
        AlertsService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesTileComponent);
    component = fixture.componentInstance;
    notesPageService = TestBed.inject(NotesPageService);
    sampleNoteSummary = {
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
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', () => {
    component.notesPostSummary =
      NoteSummary.createFromBackendDict(sampleNoteSummary);

    component.ngOnInit();

    expect(component.lastUpdatedDateString).toEqual('Nov 21, 2014');
  });

  it('should throw error if last updated value is undefined', fakeAsync(() => {
    sampleNoteSummary = {
      id: 'sampleId',
      author_username: 'test_username',
      displayed_author_name: 'test_user',
      title: 'Title',
      subtitle: 'Subtitle',
      summary: 'Hello World',
      url_fragment: 'title',
      // This throws "Value 'undefined' is not assignable to parameter of type
      // 'String'." We need to suppress this error because of the need to
      // test validations. This throws an error because last_updated is
      // undefined.
      // @ts-ignore
      last_updated: undefined,
      published_on: '11/21/2014',
    };

    component.notesPostSummary =
      NoteSummary.createFromBackendDict(sampleNoteSummary);

    expect(() => {
      component.ngOnInit();
      tick();
    }).toThrowError();
  }));

  it('should get formatted date string from the timestamp in milliseconds', () => {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    let DATE = '11/21/2014';
    expect(component.getDateStringInWords(DATE)).toBe('Nov 21, 2014');

    DATE = '01/16/2027';
    expect(component.getDateStringInWords(DATE)).toBe('Jan 16, 2027');

    DATE = '02/02/2018';
    expect(component.getDateStringInWords(DATE)).toBe('Feb 2, 2018');
  });

  it('should navigate to notes post editor interface on clicking edit', () => {
    spyOn(notesPageService, 'navigateToEditorTabWithId');
    component.notesPostSummary =
      NoteSummary.createFromBackendDict(sampleNoteSummary);

    component.editNotesPost();

    expect(notesPageService.navigateToEditorTabWithId).toHaveBeenCalledWith(
      'sampleId'
    );
  });
});
