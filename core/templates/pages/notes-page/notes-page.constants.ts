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
 * @fileoverview Constants for the Oppia note page.
 */

export const NotesPageConstants = {
  NOTE_DATA_URL_TEMPLATE: '/notehandler/data',

  NOTE_EDITOR_DATA_URL_TEMPLATE: '/noteeditorhandler/data/<note_id>',

  NOTE_TITLE_HANDLER_URL_TEMPLATE: '/notetitlehandler/data/<note_id>',

  NOTE_TAB_URLS: {
    PUBLISHED: '#/published',
    DRAFTS: '#/drafts',
    NOTE_EDITOR: '#/note_editor/<note_id>',
  },

  NOTE_ACTIONS: {
    DELETE: 'delete',
    UNPUBLISH: 'unpublish',
    PUBLISH: 'publish',
  },
} as const;