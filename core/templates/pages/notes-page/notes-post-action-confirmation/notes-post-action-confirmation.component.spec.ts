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
 * @fileoverview Unit tests for notes post action confirmation component.
 */

import {NgbActiveModal, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NotesPostActionConfirmationModalComponent} from './notes-post-action-confirmation.component';
import {NotesPageService} from 'pages/notes-page/services/notes-page.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Notes Post Action Confirmation Modal Component', () => {
  let component: NotesPostActionConfirmationModalComponent;
  let notesPageService: NotesPageService;
  let fixture: ComponentFixture<NotesPostActionConfirmationModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModalModule],
      declarations: [NotesPostActionConfirmationModalComponent],
      providers: [
        NotesPageService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(
      NotesPostActionConfirmationModalComponent
    );
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    notesPageService = TestBed.inject(NotesPageService);
  }));

  it('should close the modal when confirmed', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    component.confirm(1);

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the modal when dismissed', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.cancel(1);

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should initialize with correct action', () => {
    notesPageService.notesPostAction = 'delete';

    component.ngOnInit();

    expect(component.notesPostAction).toBe('delete');
  });

  it('should return correct boolean value if action is delete', () => {
    component.notesPostAction = 'delete';

    component.isActionDelete();

    expect(component.isActionDelete()).toBe(true);

    component.notesPostAction = 'publish';

    component.isActionDelete();

    expect(component.isActionDelete()).toBe(false);

    component.notesPostAction = 'unpublish';

    component.isActionDelete();

    expect(component.isActionDelete()).toBe(false);
  });

  it('should return correct boolean value if action is publish', () => {
    component.notesPostAction = 'publish';

    component.isActionPublish();

    expect(component.isActionPublish()).toBe(true);

    component.notesPostAction = 'delete';

    component.isActionPublish();

    expect(component.isActionPublish()).toBe(false);

    component.notesPostAction = 'unpublish';

    component.isActionPublish();

    expect(component.isActionPublish()).toBe(false);
  });

  it('should return correct boolean value if action is unpublish', () => {
    component.notesPostAction = 'unpublish';

    component.isActionUnpublish();

    expect(component.isActionUnpublish()).toBe(true);

    component.notesPostAction = 'delete';

    component.isActionUnpublish();

    expect(component.isActionUnpublish()).toBe(false);

    component.notesPostAction = 'publish';

    component.isActionUnpublish();

    expect(component.isActionUnpublish()).toBe(false);
  });
});
