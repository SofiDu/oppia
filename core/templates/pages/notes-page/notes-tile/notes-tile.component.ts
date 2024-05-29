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
 * @fileoverview Component for a notes card.
 */

import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {NoteSummary} from 'domain/note/note-summary.model';
import dayjs from 'dayjs';
import {NotesPageService} from '../services/notes-page.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NotesPostActionConfirmationModalComponent} from 'pages/notes-page/notes-post-action-confirmation/notes-post-action-confirmation.component';
import {NoteEditorBackendApiService} from 'domain/note/note-editor-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';

@Component({
  selector: 'oppia-notes-tile',
  templateUrl: './notes-tile.component.html',
})
export class NotesTileComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() notesPostSummary!: NoteSummary;
  @Input() activeView!: string;
  @Input() notesPostIsPublished: boolean = false;
  lastUpdatedDateString: string = '';
  summaryContent!: string;
  @Output() unpublisedNotesPost: EventEmitter<void> = new EventEmitter();
  @Output() deletedNotesPost: EventEmitter<void> = new EventEmitter();
  constructor(
    private notesPageService: NotesPageService,
    private notesPostEditorBackendService: NoteEditorBackendApiService,
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
    private truncatePipe: TruncatePipe
  ) {}

  ngOnInit(): void {
    const lastUpdated = this.notesPostSummary.lastUpdated;
    if (lastUpdated === undefined) {
      throw new Error('Last updated date is undefined');
    }
    this.lastUpdatedDateString = this.getDateStringInWords(lastUpdated);
    // Truncating the summary to 220 characters to avoid display in notes
    // tile to avoid overflow of text outside the tile.
    this.summaryContent = this.truncatePipe.transform(
      this.notesPostSummary.summary,
      220
    );
  }

  getDateStringInWords(naiveDate: string): string {
    return dayjs(naiveDate.split(',')[0], 'MM-DD-YYYY').format('MMM D, YYYY');
  }

  editNotesPost(): void {
    this.notesPageService.navigateToEditorTabWithId(this.notesPostSummary.id);
  }

  deleteNotesPost(): void {
    this.notesPageService.notesPostAction = 'delete';
    this.ngbModal
      .open(NotesPostActionConfirmationModalComponent, {
        backdrop: 'static',
        keyboard: false,
      })
      .result.then(
        () => {
          this.notesPageService.notesPostId = this.notesPostSummary.id;
          this.notesPageService.deleteNotesPost();
          this.deletedNotesPost.emit();
        },
        () => {
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  unpublishNotesPost(): void {
    this.notesPageService.notesPostAction = 'unpublish';
    this.ngbModal
      .open(NotesPostActionConfirmationModalComponent, {
        backdrop: 'static',
        keyboard: false,
      })
      .result.then(
        () => {
          this.notesPostEditorBackendService
            .updateNoteDataAsync(this.notesPostSummary.id, false, {})
            .then(
              () => {
                this.unpublisedNotesPost.emit();
              },
              errorResponse => {
                this.alertsService.addWarning(
                  `Failed to unpublish Notes Post. Internal Error: ${errorResponse}`
                );
              }
            );
        },
        () => {
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }
}
