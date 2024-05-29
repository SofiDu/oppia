// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for NoteAdminDataService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {NoteAdminDataService} from 'pages/note-admin-page/services/note-admin-data.service';
import {
  NoteAdminPageData,
  NoteAdminPageDataBackendDict,
} from 'domain/note-admin/note-admin-backend-api.service';

describe('Note Admin Data Service', () => {
  let noteAdminDataService: NoteAdminDataService;
  let httpTestingController: HttpTestingController;
  let sampleNoteAdminData: NoteAdminPageDataBackendDict = {
    role_to_actions: {
      note_editor: ['action for editor'],
    },
    platform_parameters: {},
    updatable_roles: {
      note_editor: 'note_editor',
    },
  };
  let noteAdminDataResponse: NoteAdminPageData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NoteAdminDataService],
    });
    noteAdminDataService = TestBed.inject(NoteAdminDataService);
    httpTestingController = TestBed.inject(HttpTestingController);
    noteAdminDataResponse = {
      updatableRoles: sampleNoteAdminData.updatable_roles,
      roleToActions: sampleNoteAdminData.role_to_actions,
      platformParameters: sampleNoteAdminData.platform_parameters,
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return the correct note admin data', fakeAsync(() => {
    noteAdminDataService.getDataAsync().then(response => {
      expect(response).toEqual(noteAdminDataResponse);
    });

    var req = httpTestingController.expectOne('/noteadminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleNoteAdminData);

    flushMicrotasks();
  }));
});
