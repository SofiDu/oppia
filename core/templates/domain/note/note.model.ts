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
 * @fileoverview Model for creating and mutating instances of frontend
 * note domain objects.
 */

import {AppConstants} from 'app.constants';
export interface NoteBackendDict {
  id: string;
  displayed_author_name: string;
  title: string;
  subtitle: string;
  content: string;
  url_fragment: string;
  last_updated?: string;
  published_on?: string;
}
export class NoteData {
  _id: string;
  _displayedAuthorName: string;
  _title: string;
  _subtitle: string;
  _content: string;
  _urlFragment: string;
  _lastUpdated?: string;
  _publishedOn?: string;
  constructor(
    id: string,
    displayedAuthorName: string,
    title: string,
    subtitle: string,
    content: string,
    urlFragment: string,
    lastUpdated?: string,
    publishedOn?: string
  ) {
    this._id = id;
    this._displayedAuthorName = displayedAuthorName;
    this._title = title;
    this._subtitle = subtitle;
    this._content = content;
    this._urlFragment = urlFragment;
    this._lastUpdated = lastUpdated;
    this._publishedOn = publishedOn;
  }

  get id(): string {
    return this._id;
  }

  get displayedAuthorName(): string {
    return this._displayedAuthorName;
  }

  get lastUpdated(): string | undefined {
    return this._lastUpdated;
  }

  get publishedOn(): string | undefined {
    return this._publishedOn;
  }

  set title(title: string) {
    this._title = title;
  }

  get title(): string {
    return this._title;
  }

  set subtitle(subtitle: string) {
    this._subtitle = subtitle;
  }

  get subtitle(): string {
    return this._subtitle;
  }

  get urlFragment(): string {
    return this._urlFragment;
  }

  get content(): string {
    return this._content;
  }

  set content(content: string) {
    this._content = content;
  }

  validate(): string[] {
    let issues = [];
    let validTitleRegex: RegExp = new RegExp(
      AppConstants.VALID_NOTE_TITLE_REGEX
    );
    if (this._title === '') {
      issues.push('Note title should not be empty.');
    } else if (!validTitleRegex.test(this._title)) {
      issues.push('Note title contains invalid characters.');
    } else if (this._title.length < AppConstants.MIN_CHARS_IN_NOTE_TITLE) {
      issues.push(
        'Note title should not be less than ' +
          `${AppConstants.MIN_CHARS_IN_NOTE_TITLE} characters.`
      );
    } else if (this._title.length > AppConstants.MAX_CHARS_IN_NOTE_TITLE) {
      issues.push(
        'Note title should not be more than ' +
          `${AppConstants.MAX_CHARS_IN_NOTE_TITLE} characters.`
      );
    }
    if (this._content === '') {
      issues.push('Note content should not be empty.');
    }
    return issues;
  }

  prepublishValidate(maxTags: number): string[] {
    let issues = [];
    let validTitleRegex: RegExp = new RegExp(
      AppConstants.VALID_NOTE_TITLE_REGEX
    );
    if (this._title === '') {
      issues.push('Note title should not be empty.');
    } else if (!validTitleRegex.test(this._title)) {
      issues.push('Note title contains invalid characters.');
    } else if (this._title.length > AppConstants.MAX_CHARS_IN_NOTE_TITLE) {
      issues.push(
        'Note title should not exceed ' +
          `${AppConstants.MAX_CHARS_IN_NOTE_TITLE} characters.`
      );
    } else if (this._title.length < AppConstants.MIN_CHARS_IN_NOTE_TITLE) {
      issues.push(
        'Note title should not be less than ' +
          `${AppConstants.MIN_CHARS_IN_NOTE_TITLE} characters.`
      );
    }
    if (this._content === '') {
      issues.push('Note content should not be empty.');
    }
    return issues;
  }

  static createFromBackendDict(noteBackendDict: NoteBackendDict): NoteData {
    return new NoteData(
      noteBackendDict.id,
      noteBackendDict.displayed_author_name,
      noteBackendDict.title,
      noteBackendDict.subtitle,
      noteBackendDict.content,
      noteBackendDict.url_fragment,
      noteBackendDict.last_updated,
      noteBackendDict.published_on
    );
  }
}
