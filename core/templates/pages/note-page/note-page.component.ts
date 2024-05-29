// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Data and component for the note page.
 */

import {Component, OnInit, Input} from '@angular/core';
import {NotePageData} from 'domain/note/note-homepage-backend-api.service';
import {NoteData} from 'domain/note/note.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {UrlService} from 'services/contextual/url.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NotePageService} from './services/note-page.service';
import {UserService} from 'services/user.service';
import dayjs from 'dayjs';

import './note-page.component.css';

@Component({
  selector: 'oppia-note-page',
  templateUrl: './note-page.component.html',
})
export class NotePageComponent implements OnInit {
  @Input() notePageData!: NotePageData;

  noteUrlFragment!: string;
  note!: NoteData;
  publishedDateString: string = '';
  authorUsername!: string;

  constructor(
    private windowDimensionsService: WindowDimensionsService,
    private urlService: UrlService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private notePageService: NotePageService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.noteUrlFragment = this.urlService.getNoteUrlFromUrl();
    this.authorUsername = this.notePageData.authorUsername;
    this.note = this.notePageData.noteDict;
    this.notePageService.noteId = this.notePageData.noteDict.id;
    if (this.note.publishedOn) {
      this.publishedDateString = this.getDateStringInWords(
        this.note.publishedOn
      );
    }
  }

  getPageUrl(): string {
    return this.urlService.getCurrentLocation().href;
  }

  copyLink(className: string): void {
    const codeDiv = document.getElementsByClassName(className)[0];
    const range = document.createRange();
    range.setStartBefore((codeDiv as HTMLDivElement).firstChild as Node);
    range.setEndAfter((codeDiv as HTMLDivElement).lastChild as Node);
    // 'getSelection()' will not return 'null' since it is not called on an
    // undisplayed <iframe>. That is why we can use '?'.
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.execCommand('copy');
    selection?.removeAllRanges();
  }

  getDateStringInWords(naiveDate: string): string {
    return dayjs(naiveDate.split(',')[0], 'MM-DD-YYYY').format('MMMM D, YYYY');
  }

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 900;
  }
}
