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
 * @fileoverview Tests for Note Admin tab component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {
  NoteAdminBackendApiService,
  NoteAdminPageData,
} from 'domain/note-admin/note-admin-backend-api.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AdminTaskManagerService} from 'pages/admin-page/services/admin-task-manager.service';
import {NoteAdminPageComponent} from 'pages/note-admin-page/note-admin-page.component';
class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash',
    },
    open() {
      return;
    },
  };
}

describe('Note Admin Page component ', () => {
  let component: NoteAdminPageComponent;
  let fixture: ComponentFixture<NoteAdminPageComponent>;

  let noteAdminBackendApiService: NoteAdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let mockWindowRef: MockWindowRef;

  let startTaskSpy: jasmine.Spy;
  let finishTaskSpy: jasmine.Spy;

  const noteAdminPageData: NoteAdminPageData = {
    roleToActions: {
      note_post_editor: ['action for editor'],
    },
    platform_parameters: {},
    updatableRoles: {
      note_post_editor: 'note_post_editor',
    },
  };

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [NoteAdminPageComponent],
      providers: [
        NoteAdminBackendApiService,
        AdminTaskManagerService,
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteAdminPageComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    noteAdminBackendApiService = TestBed.inject(NoteAdminBackendApiService);
    adminTaskManagerService = TestBed.inject(AdminTaskManagerService);

    startTaskSpy = spyOn(adminTaskManagerService, 'startTask');
    finishTaskSpy = spyOn(adminTaskManagerService, 'finishTask');
    spyOn(noteAdminBackendApiService, 'getDataAsync').and.resolveTo(
      noteAdminPageData
    );
    confirmSpy = spyOn(mockWindowRef.nativeWindow, 'confirm');
  });

  it('should refresh roles form data when initialized', fakeAsync(() => {
    expect(component.formData).toBe(undefined);

    component.ngOnInit();
    tick();

    expect(component.formData.updateRole.newRole).toBe(null);
    expect(component.formData.updateRole.username).toBe('');
    expect(component.formData.removeEditorRole.username).toBe('');
  }));

  it('should set correct values for properties when initialized', fakeAsync(() => {
    expect(component.UPDATABLE_ROLES).toEqual({});
    expect(component.roleToActions).toBe(undefined);

    component.ngOnInit();
    tick();

    expect(component.UPDATABLE_ROLES).toEqual(noteAdminPageData.updatableRoles);
    expect(component.roleToActions).toEqual(noteAdminPageData.roleToActions);
  }));

  it('should not submit update role form if already a task is in queue', fakeAsync(() => {
    component.ngOnInit();
    tick();
    component.formData.updateRole.newRole = 'NOTE_ADMIN';
    component.formData.updateRole.username = 'username';
    spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

    component.submitUpdateRoleForm(component.formData.updateRole);

    expect(startTaskSpy).not.toHaveBeenCalled();
    expect(finishTaskSpy).not.toHaveBeenCalled();
  }));

  it('should not submit update role form in case of backend error', fakeAsync(() => {
    component.ngOnInit();
    tick();
    component.formData.updateRole.newRole = 'NOTE_ADMIN';
    component.formData.updateRole.username = 'username';
    spyOn(noteAdminBackendApiService, 'updateUserRoleAsync').and.returnValue(
      Promise.reject('The user already has this role.')
    );
    spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
    component.submitUpdateRoleForm(component.formData.updateRole);

    expect(startTaskSpy).toHaveBeenCalled();
    expect(component.statusMessage).toBe('Updating User Role');

    flushMicrotasks();

    expect(component.statusMessage).toBe('The user already has this role.');
    expect(finishTaskSpy).toHaveBeenCalled();
  }));
});
