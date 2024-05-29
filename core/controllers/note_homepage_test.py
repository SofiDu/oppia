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

"""Tests for the note homepage page."""

from __future__ import annotations

from core import feconf
from core.domain import note_services
from core.tests import test_utils


class NoteHomepageDataHandlerTest(test_utils.GenericTestBase):
    """Checks that the data for note homepage is handled properly."""

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
        """Complete the setup process for testing."""
        super().setUp()
        self.signup(
            self.NOTE_ADMIN_EMAIL, self.NOTE_ADMIN_USERNAME)
        self.note_admin_id = (
            self.get_user_id_from_email(self.NOTE_ADMIN_EMAIL))
        self.add_user_role(
            self.NOTE_ADMIN_USERNAME,
            feconf.ROLE_ID_NOTE_ADMIN)
        self.signup(self.user_email, self.username)
        note_post = note_services.create_new_note(self.note_admin_id)
        self.change_dict: note_services.NoteChangeDict = {
            'title': 'Sample Title',
            'subtitle': '',
            'content': '<p>Hello Notegers<p>'
        }
        note_services.update_note(note_post.id, self.change_dict)
        note_services.publish_note(note_post.id)

    def test_get_note_homepage_data(self) -> None:
        self.login(self.user_email)
        json_response = self.get_json(
            '%s?offset=0' % (feconf.NOTE_HOMEPAGE_URL),
            )
        self.assertEqual(
            self.NOTE_ADMIN_USERNAME,
            json_response['note_post_summary_dicts'][0]['displayed_author_name']
        )
        self.assertEqual(
            len(json_response['note_post_summary_dicts']), 1)
        self.assertEqual(json_response['no_of_note_post_summaries'], 1)

        note_post_two = note_services.create_new_note(self.note_admin_id)
        change_dict_two: note_services.NoteChangeDict = {
            'title': 'Sample Title Two',
            'subtitle': '',
            'content': '<p>Hello Note<p>'
        }
        note_services.update_note(note_post_two.id, change_dict_two)
        note_services.publish_note(note_post_two.id)
        json_response = self.get_json(
            '%s?offset=0' % feconf.NOTE_HOMEPAGE_URL)
        self.assertEqual(
            len(json_response['note_post_summary_dicts']), 2)
        self.assertEqual(json_response['no_of_note_post_summaries'], 2)
        self.assertTrue(
            json_response['note_post_summary_dicts'][0]['published_on'] >
            json_response['note_post_summary_dicts'][1]['published_on']
        )
        self.assertEqual(
            json_response['note_post_summary_dicts'][0]['title'],
            'Sample Title Two'
        )

        json_response = self.get_json(
            '%s?offset=1' % feconf.NOTE_HOMEPAGE_URL
        )
        self.assertEqual(
            len(json_response['note_post_summary_dicts']), 1)
        self.assertEqual(
            json_response['note_post_summary_dicts'][0]['title'],
            'Sample Title'
        )
        self.assertEqual(
            json_response['note_post_summary_dicts'][0]['author_username'],
            self.NOTE_ADMIN_USERNAME
        )
        self.assertEqual(
            json_response[
                'note_post_summary_dicts'][0]['displayed_author_name'],
            self.NOTE_ADMIN_USERNAME
        )
