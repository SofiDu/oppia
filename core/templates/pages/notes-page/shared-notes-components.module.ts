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
 * @fileoverview Module for the shared notes components.
 */

import {NgModule} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {HttpClientModule} from '@angular/common/http';
import {SharedComponentsModule} from 'components/shared-component.module';

import {NotesPostActionConfirmationModalComponent} from 'pages/notes-page/notes-post-action-confirmation/notes-post-action-confirmation.component';
import {NotesCardComponent} from 'pages/notes-page/notes-card/notes-card.component';
import {NotesTileComponent} from 'pages/notes-page/notes-tile/notes-tile.component';
import {NoteEditorComponent} from 'pages/notes-page/note-editor/note-editor.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    SharedComponentsModule,
    MatTabsModule,
    MatMenuModule,
    MatButtonToggleModule,
  ],
  declarations: [
    NotesCardComponent,
    NotesTileComponent,
    NoteEditorComponent,
    NotesPostActionConfirmationModalComponent,
  ],
  entryComponents: [
    NotesCardComponent,
    NotesTileComponent,
    NoteEditorComponent,
    NotesPostActionConfirmationModalComponent,
  ],
  exports: [
    NotesCardComponent,
    NotesTileComponent,
    NoteEditorComponent,
    NotesPostActionConfirmationModalComponent,
  ],
})
export class SharedNotesComponentsModule {}
