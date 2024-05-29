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

import {Component, Input, OnInit} from '@angular/core';
import {NoteSummary} from 'domain/note/note-summary.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {NotesPageConstants} from 'pages/notes-page/notes-page.constants';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ContextService} from 'services/context.service';
import dayjs from 'dayjs';
import {UserService} from 'services/user.service';

@Component({
  selector: 'oppia-notes-card',
  templateUrl: './notes-card.component.html',
})
export class NotesCardComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() NoteSummary!: NoteSummary;
  @Input() shownOnnotesPostPage!: boolean;
  publishedDateString: string = '';
  notesCardPreviewModeIsActive: boolean = false;

  constructor(
    private windowRef: WindowRef,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private contextService: ContextService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const publishedOn = this.NoteSummary.publishedOn;
    if (publishedOn === undefined) {
      throw new Error('Notes Post Summary published date is not defined');
    }
    this.publishedDateString = this.getDateStringInWords(publishedOn);
  }

  getDateStringInWords(naiveDate: string): string {
    return dayjs(naiveDate.split(',')[0], 'MM-DD-YYYY').format('MMMM D, YYYY');
  }

  navigateToNotesPostPage(): void {
    if (!this.notesCardPreviewModeIsActive) {
      let notesPostUrl = this.urlInterpolationService.interpolateUrl(
        NotesPageConstants.NOTE_TITLE_HANDLER_URL_TEMPLATE,
        {notes_post_url: this.NoteSummary.urlFragment}
      );
      this.windowRef.nativeWindow.location.href = notesPostUrl;
    }
  }
}
