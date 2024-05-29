# Copyright 2021 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for the notes page."""

from __future__ import annotations

from core import feconf
from core.domain import note_services
from core.tests import test_utils


class NotesPageDataHandlerTests(test_utils.GenericTestBase):

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(
            self.NOTE_ADMIN_EMAIL, self.NOTE_ADMIN_USERNAME)
        self.signup(
            self.NOTE_EDITOR_EMAIL, self.NOTE_EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.add_user_role(
            self.NOTE_ADMIN_USERNAME, feconf.ROLE_ID_NOTE_ADMIN)
        self.add_user_role(
            self.NOTE_EDITOR_USERNAME,
            feconf.ROLE_ID_NOTE_EDITOR)

    def test_get_dashboard_page_data(self) -> None:
        # Checks note editor can access notes page.
        self.login(self.NOTE_EDITOR_EMAIL)
        json_response = self.get_json(
            '%s' % (feconf.NOTES_PAGE_DATA_URL),
            )
        self.assertEqual(json_response['published_note_summary_dicts'], [])
        self.assertEqual(json_response['draft_note_summary_dicts'], [])
        self.logout()

        # Checks note admin can access notes page.
        self.login(self.NOTE_ADMIN_EMAIL)
        json_response = self.get_json(
            '%s' % (feconf.NOTES_PAGE_DATA_URL),
            )
        self.assertEqual(self.NOTE_ADMIN_USERNAME, json_response['username'])
        self.assertEqual(json_response['published_note_summary_dicts'], [])
        self.assertEqual(json_response['draft_note_summary_dicts'], [])
        self.logout()

        # Checks for correct published and draft note post summary data.
        note = note_services.create_new_note('id')
        change_dict: note_services.NoteChangeDict = {
            'title': 'Sample Title',
            'subtitle': '',
            'content': '<p>Hello Note<p>'
        }
        self.login(self.NOTE_EDITOR_EMAIL)
        json_response = self.get_json(
            '%s' % (feconf.NOTES_PAGE_DATA_URL))
        self.assertEqual(self.NOTE_EDITOR_USERNAME, json_response['username'])
        self.assertEqual(
            note.id,
            json_response['draft_note_summary_dicts'][0]['id'])

        note_services.update_note(note.id, change_dict)
        note_services.publish_note(note.id)
        json_response = self.get_json(
            '%s' % (feconf.NOTES_PAGE_DATA_URL))
        self.assertEqual(self.NOTE_EDITOR_USERNAME, json_response['username'])
        self.assertEqual(
            note.id,
            json_response['published_note_summary_dicts'][0]['id'])
        self.assertEqual(
            change_dict['title'],
            json_response['published_note_summary_dicts'][0]['title'])
        self.assertEqual(json_response['draft_note_summary_dicts'], [])
