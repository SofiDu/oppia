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
 * @fileoverview Service to handle the updating of a note.
 */
import {Injectable} from '@angular/core';
import {NoteData} from 'domain/note/note.model';
import {downgradeInjectable} from '@angular/upgrade/static';

export interface NoteChangeDict {
  title?: string;
  subtitle?: string;
  content?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NoteUpdateService {
  changeDict: NoteChangeDict = {};

  setNoteTitle(note: NoteData, title: string): void {
    note.title = title;
    this.changeDict.title = title;
  }

  setNoteSubtitle(note: NoteData, subtitle: string): void {
    note.subtitle = subtitle;
    this.changeDict.subtitle = subtitle;
  }

  setNoteContent(note: NoteData, content: string): void {
    note.content = content;
    this.changeDict.content = content;
  }

  getNoteChangeDict(): NoteChangeDict {
    return this.changeDict;
  }

  setNoteChangeDictToDefault(): void {
    this.changeDict = {};
  }
}

angular
  .module('oppia')
  .factory('NoteUpdateService', downgradeInjectable(NoteUpdateService));
