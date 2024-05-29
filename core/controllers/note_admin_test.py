# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the note admin page."""

from __future__ import annotations

from core import feconf
from core.tests import test_utils


class BlogAdminRolesHandlerTest(test_utils.GenericTestBase):
    """Checks the user role handling on the note admin page."""

    def setUp(self) -> None:
        """Complete the signup process for self.ADMIN_EMAIL."""
        super().setUp()
        self.signup(
            self.NOTE_ADMIN_EMAIL, self.NOTE_ADMIN_USERNAME)

        self.add_user_role(
            self.NOTE_ADMIN_USERNAME,
            feconf.ROLE_ID_NOTE_ADMIN)

    def test_updating_and_removing_note_editor_role_successfully(
            self
    ) -> None:
        user_email = 'user1@example.com'
        username = 'user1'

        self.signup(user_email, username)
        self.login(self.NOTE_ADMIN_EMAIL)

        # Check role correctly gets updated.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.post_json(
            feconf.NOTE_ADMIN_ROLE_HANDLER_URL,
            {
                'role': feconf.ROLE_ID_NOTE_EDITOR,
                'username': username
            },
            csrf_token=csrf_token,
            expected_status_int=200)
        self.assertEqual(response_dict, {})

        # Check removing user from note editor role.
        csrf_token = self.get_new_csrf_token()
        response_dict = self.put_json(
            feconf.NOTE_ADMIN_ROLE_HANDLER_URL,
            {'username': username},
            csrf_token=csrf_token,
            expected_status_int=200)
        self.assertEqual(response_dict, {})

    def test_removing_note_editor_role_for_invalid_user(self) -> None:
        username = 'invaliduser'

        self.login(self.NOTE_ADMIN_EMAIL)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            feconf.NOTE_ADMIN_ROLE_HANDLER_URL,
            {'username': username},
            csrf_token=csrf_token,
            expected_status_int=400)

        csrf_token = self.get_new_csrf_token()
        self.put_json(
            feconf.NOTE_ADMIN_ROLE_HANDLER_URL,
            {},
            csrf_token=csrf_token,
            expected_status_int=400)
