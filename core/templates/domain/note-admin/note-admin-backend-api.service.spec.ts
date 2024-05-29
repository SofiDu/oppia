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
 * @fileoverview Unit tests for NoteAdminBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  NoteAdminPageData,
  NoteAdminBackendApiService,
} from './note-admin-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('Note Admin backend api service', () => {
  let babas: NoteAdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let noteAdminBackendResponse = {
    role_to_actions: {
      note_post_editor: ['action for editor'],
    },
    updatable_roles: {
      note_post_editor: 'note_post_editor',
    },
  };
  let noteAdminDataObject: NoteAdminPageData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    babas = TestBed.inject(NoteAdminBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    csrfService = TestBed.inject(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    noteAdminDataObject = {
      updatableRoles: noteAdminBackendResponse.updatable_roles,
      roleToActions: noteAdminBackendResponse.role_to_actions,
    };

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch the data.', fakeAsync(() => {
    babas.getDataAsync().then(noteAdminData => {
      expect(noteAdminData).toEqual(noteAdminDataObject);
    });

    let req = httpTestingController.expectOne('/noteadminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(noteAdminBackendResponse);

    flushMicrotasks();
  }));

  it(
    'should update the role of the user given the name' +
      'when calling updateUserRoleAsync',
    fakeAsync(() => {
      let newRole = 'NOTE_EDITOR';
      let username = 'validUser';
      let payload = {
        role: newRole,
        username: username,
      };
      babas
        .updateUserRoleAsync(newRole, username)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/noteadminrolehandler');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(payload);

      req.flush({status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
