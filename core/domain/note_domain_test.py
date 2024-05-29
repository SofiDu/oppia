# coding: utf-8
#
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

"""Tests for note domain objects."""

from __future__ import annotations

from core import utils
from core.domain import note_domain
from core.domain import note_services
from core.platform import models
from core.tests import test_utils


(note_models,) = models.Registry.import_models([models.Names.NOTE])


class NoteDomainUnitTests(test_utils.GenericTestBase):
    """Tests for note domain objects."""

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')

        self.Note = note_services.create_new_note(self.user_id_a)

    def _assert_strict_validation_error(
            self, expected_error_substring: str
    ) -> None:
        """Checks that the note passes strict validation."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            self.Note.validate(strict=True)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with TestBase._assert_validation_error().
    def _assert_validation_error( # type: ignore[override]
            self, expected_error_substring: str
    ) -> None:
        """Checks that the note passes validation."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            self.Note.validate()

    def _assert_valid_url_fragment(
            self, expected_error_substring: str
    ) -> None:
        """Checks that note passes strict validation for url."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.Note.require_valid_url_fragment(
                self.Note.url_fragment)

    def _assert_strict_valid_title_for_note(
            self, expected_error_substring: str, title: str
    ) -> None:
        """Checks that note passes strict validation for title."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.Note.require_valid_title(title, True)

    def _assert_valid_title_for_note(
            self, expected_error_substring: str, title: str
    ) -> None:
        """Checks that note passes validation for title."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.Note.require_valid_title(title, False)

    def _assert_valid_url_fragment_for_note(
            self, expected_error_substring: str, url: str
    ) -> None:
        """Checks that note passes validation for url."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.Note.require_valid_url_fragment(url)

    def _assert_valid_note_id_for_note(
            self, expected_error_substring: str, note_id: str
    ) -> None:
        """Checks that note passes validation for id."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.Note.require_valid_note_id(note_id)

    def test_note_id_validation_for_note(self) -> None:
        self._assert_valid_note_id_for_note(
            'Note ID abcdef is invalid', 'abcdef')

    def test_title_without_non_strict_validation(self) -> None:
        self._assert_valid_title_for_note(
            'Note title should at most have 65 chars, received: '
            'Very long title with more than sixty five chars and therefore an'
            ' invalid note title',
            'Very long title with more than sixty five chars and therefore an'
            ' invalid note title')

    def test_title_with_strict_validation(self) -> None:
        self._assert_strict_valid_title_for_note(
            'Title should not be empty', '')
        self._assert_strict_valid_title_for_note(
            'Title field contains invalid characters. Only words '
            r'\(a-zA-Z0-9\(\'!\)\) separated by spaces\, hyphens \(-\)\, comma '
            r'\(\,\)\, ampersand \(&\) and colon \(:\) are allowed.'
            'Received %s' % r'ABC12@heloo', r'ABC12@heloo'
        )

    def test_url_fragment_validation(self) -> None:
        self._assert_valid_url_fragment_for_note(
            'Note URL Fragment field should not be empty.', '')
        self._assert_valid_url_fragment_for_note(
            'Note URL Fragment field should not be empty.', '')
        url_fragment = 'very-very-long' * 30
        url_fragment_char_limit = (
            note_domain.MAX_CHARS_IN_NOTE_URL_FRAGMENT
        )
        self._assert_valid_url_fragment_for_note(
            'Note URL Fragment field should not exceed %d characters.'
            % (url_fragment_char_limit), url_fragment)
        self._assert_valid_url_fragment_for_note(
            'Note URL Fragment field contains invalid characters.'
            'Only lowercase words, numbers separated by hyphens are allowed. '
            'Received %s.' % ('oppia-in-covid19-#'), 'oppia-in-covid19-#')

        note_domain.Note.require_valid_url_fragment('oppia-in-covid19')

    def test_update_title(self) -> None:
        self.assertEqual(self.Note.title, '')
        self.Note.update_title('Note Title')
        self.assertEqual(self.Note.title, 'Note Title')

    def test_update_url_fragment(self) -> None:
        current_url_fragment = ''
        self.assertEqual(self.Note.url_fragment, current_url_fragment)
        self.Note.update_url_fragment('url-fragment')
        self.assertEqual(self.Note.url_fragment, 'url-fragment')

    def test_note_contents_export_import(self) -> None:
        """Test that to_dict and from_dict preserve all data within a
        note contents object.
        """
        note_contents_dict = self.Note.to_dict()
        note_contents_from_dict = note_domain.Note.from_dict(
            note_contents_dict)
        self.assertEqual(
            note_contents_from_dict.to_dict(), note_contents_dict)

    def test_update_content(self) -> None:
        self.assertEqual(self.Note.content, '')
        self.Note.update_content('<p>Hello</p>')
        self.assertEqual(self.Note.content, '<p>Hello</p>')

    # TODO(#13059):Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_note_passes_validate(self) -> None:
        """Tests validation for note."""
        self.Note.validate(strict=False)
        self.Note.content = 123  # type: ignore[assignment]
        self._assert_validation_error(
            'Expected contents to be a string, received: 123')

    def test_note_passes_strict_validation(self) -> None:
        """Tests strict validation for note."""
        self.Note.title = 'Sample Title'
        self.Note.url_fragment = 'sample-title'
        self._assert_strict_validation_error('Content can not be empty')

        self.Note.content = '<p>Hello</p>'
        self.Note.validate(strict=True)


class NoteSummaryUnitTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        note = note_services.create_new_note(self.user_id_a)
        self.note_id = note.id
        self.note_summary = (
            note_services.get_note_summary_by_id(self.note_id))

    def _assert_strict_valid_title_for_note(
            self, expected_error_substring: str, title: str
    ) -> None:
        """Checks that note passes strict validation for title."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.NoteSummary.require_valid_title(title, True)

    def _assert_valid_title_for_note(
            self, expected_error_substring: str, title: str
    ) -> None:
        """Checks that note passes validation for title."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.NoteSummary.require_valid_title(title, False)

    def _assert_valid_url_fragment_for_note(
            self, expected_error_substring: str, url: str
    ) -> None:
        """Checks that note passes validation for url."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.NoteSummary.require_valid_url_fragment(url)

    def _assert_url_fragment_passes_valid_url_fragment(
            self, expected_error_substring: str
    ) -> None:
        """Checks that note passes validation for url."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.NoteSummary.require_valid_url_fragment(
                self.note_summary.url_fragment)

    def _assert_title_passes_valid_title(
            self, expected_error_substring: str
    ) -> None:
        """Checks that note passes validation for title."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            note_domain.NoteSummary.require_valid_title(
                self.note_summary.title, False)

    def test_title_validation(self) -> None:
        self._assert_valid_title_for_note(
            'Note title should at most have 65 chars, received: '
            'Very long title with more than sixty five chars and therefore an'
            ' invalid note title',
            'Very long title with more than sixty five chars and therefore an'
            ' invalid note title')
        self._assert_strict_valid_title_for_note(
            'Title should not be empty', '')

    def test_url_fragment_validation(self) -> None:
        self._assert_valid_url_fragment_for_note(
            'Note URL Fragment field should not be empty.', '')
        self._assert_valid_url_fragment_for_note(
            'Note URL Fragment field should not be empty.', '')
        url_fragment = 'very-very-long' * 30
        url_fragment_char_limit = (
            note_domain.MAX_CHARS_IN_NOTE_URL_FRAGMENT
        )
        self._assert_valid_url_fragment_for_note(
            'Note URL Fragment field should not exceed %d characters.'
            % (url_fragment_char_limit), url_fragment)
        self._assert_valid_url_fragment_for_note(
            'Note URL Fragment field contains invalid characters.'
            'Only lowercase words, numbers separated by hyphens are allowed. '
            'Received %s.' % ('oppia-in-covid19-#'), 'oppia-in-covid19-#')

        note_domain.NoteSummary.require_valid_url_fragment('oppia-covid19')

    def _assert_strict_validation_error(
            self, expected_error_substring: str
    ) -> None:
        """Checks that the note passes strict validation."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            self.note_summary.validate(strict=True)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with TestBase._assert_validation_error().
    def _assert_validation_error( # type: ignore[override]
            self, expected_error_substring: str
    ) -> None:
        """Checks that the note passes validation."""
        with self.assertRaisesRegex(
                utils.ValidationError, expected_error_substring):
            self.note_summary.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_note_url_fragment_passes_strict_validation(self) -> None:
        self.note_summary.title = 'Sample Title'
        self.note_summary.subtitle = 'Sample Subitle'
        self.note_summary.url_fragment = 123  # type: ignore[assignment]
        self.note_summary.summary = 'Sample Summary'
        self._assert_strict_validation_error(
            'Expected url fragment to be a string, received: 123')

        self.note_summary.url_fragment = 'sample-url-fragment'
        self.note_summary.validate(strict=True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_note_summary_passes_validate(self) -> None:
        """Tests validation for note summary."""
        self.note_summary.validate(strict=False)
        self.note_summary.summary = 123  # type: ignore[assignment]
        self._assert_validation_error(
            'Expected summary to be a string, received: 123')

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_note_passes_valid_url_fragment(self) -> None:
        self.note_summary.url_fragment = 123  # type: ignore[assignment]
        self._assert_url_fragment_passes_valid_url_fragment(
            'Note URL Fragment field must be a string. '
            'Received 123')

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_note_passes_valid_title(self) -> None:
        self.note_summary.title = 123  # type: ignore[assignment]
        self._assert_title_passes_valid_title(
            'Expected title to be a string, received: 123.')

    def test_note_summary_passes_strict_validation(self) -> None:
        """Tests note summary passes validation in strict mode."""
        self.note_summary.title = 'Sample Title'
        self.note_summary.subtitle = 'Sample Subitle'
        self.note_summary.summary = ''
        self.note_summary.url_fragment = 'sample-title'
        self._assert_strict_validation_error('Summary can not be empty')

        self.note_summary.summary = 'Hello'
        self.note_summary.validate(strict=True)


class NoteRightsDomainUnitTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        note = note_services.create_new_note(self.user_id_a)
        self.note_id = note.id
        self.note_rights = (
            note_services.get_note_rights(self.note_id))

    def test_is_editor(self) -> None:
        self.assertTrue(self.note_rights.is_editor(self.user_id_a))
        self.assertFalse(self.note_rights.is_editor(self.user_id_b))

    def test_to_human_readable_dict(self) -> None:
        """Checks conversion of NoteRights to dict."""
        expected_dict = {
            'note_id': self.note_id,
            'editor_ids': [self.user_id_a],
            'note_is_published': False
        }
        self.assertEqual(self.note_rights.to_dict(), expected_dict)
