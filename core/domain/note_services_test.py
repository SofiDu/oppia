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

"""Tests for note services."""

from __future__ import annotations

import math

from core import utils
from core.domain import note_domain
from core.domain import note_services
from core.domain import search_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import note_models

(note_models,) = models.Registry.import_models([models.Names.NOTE])

search_services = models.Registry.import_search_services()


class NoteServicesUnitTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup('a@example.com', 'A')
        self.signup('b@example.com', 'B')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_b = self.get_user_id_from_email('b@example.com')

        self.note_a = note_services.create_new_note(self.user_id_a)
        self.note_b = note_services.create_new_note(self.user_id_b)
        self.note_a_id = self.note_a.id
        self.note_b_id = self.note_b.id

        # Here we use MyPy ignore because dictionary of type NoteChangeDict
        # should contain 'title' key but for testing purpose here we are not
        # providing the 'title' key, which causes MyPy to throw error. Thus to
        # silent the error, we used ignore here.
        self.change_dict: note_services.NoteChangeDict = {  # type: ignore[typeddict-item]
            'content': '<p>hi<p>'
        }
        self.change_dict_one: note_services.NoteChangeDict = {
            'title': 'Sample Title',
            'subtitle': 'Sample Subtitle',
            'content': '<p>Hello</p>'
        }
        self.change_dict_two: note_services.NoteChangeDict = {
            'title': 'Sample title two',
            'subtitle': 'Sample Subtitle',
            'content': '<p>Hello</p>',
        }

    def test_get_note_from_model(self) -> None:
        note_model = note_models.NoteModel.get(self.note_a_id)
        note = note_services.get_note_from_model(note_model)
        self.assertEqual(note.to_dict(), self.note_a.to_dict())

    def test_get_note_by_id(self) -> None:
        expected_note = self.note_a.to_dict()
        note = note_services.get_note_by_id(self.note_a_id)
        self.assertEqual(note.to_dict(), expected_note)

    def test_get_note_summary_models_list_by_user_id(self) -> None:
        notes = (
            note_services.get_note_summary_models_list_by_user_id(
                self.user_id_a, True))
        self.assertEqual(notes, [])
        notes = (
            note_services.get_note_summary_models_list_by_user_id(
                self.user_id_a, False))
        self.assertEqual(self.note_a_id, notes[0].id)

    def test_get_new_note_id(self) -> None:
        note_id = note_services.get_new_note_id()
        self.assertFalse(note_id == self.note_a_id)
        self.assertFalse(note_id == self.note_b_id)

    def test_generate_summary_of_note(self) -> None:
        html_content = '<a href="http://www.google.com">Hello, Oppia Note</a>'
        expected_summary = 'Hello, Oppia Note'
        summary = note_services.generate_summary_of_note(html_content)
        self.assertEqual(expected_summary, summary)

        content = '<p>abc</p><strong>QWERTY</strong>' * 150
        expected_summary = 'abc' * 99 + '...'
        summary = note_services.generate_summary_of_note(content)
        self.assertEqual(expected_summary, summary)

    def test_compute_summary_of_note(self) -> None:
        expected_note_summary = (
            note_domain.NoteSummary(
                self.note_a_id,
                self.user_id_a,
                '',
                '',
                '',
                '',
                self.note_a.last_updated,
                self.note_a.published_on
            )
        )
        note_summary = (
            note_services.compute_summary_of_note(self.note_a))
        self.assertEqual(
            expected_note_summary.to_dict(), note_summary.to_dict())

    def test_get_published_note_summaries(self) -> None:
        self.assertEqual(
            len(note_services.get_published_note_summaries()),
            0
        )
        note_services.update_note(
            self.note_a_id,
            self.change_dict_two)
        note_services.publish_note(self.note_a_id)
        number_of_published_notes = (
            note_services.get_published_note_summaries(0, 2)
        )
        self.assertEqual(
            len(number_of_published_notes),
            1
        )

        number_of_published_notes = (
            note_services.get_published_note_summaries(1, 1)
        )
        self.assertEqual(len(number_of_published_notes), 0)

    def test_get_total_number_of_published_note_summaries_by_author(
            self
    ) -> None:
        self.assertEqual(
            note_services
            .get_total_number_of_published_note_summaries_by_author(
                self.user_id_a
            ), 0)

        note_services.update_note(
            self.note_a_id, self.change_dict_two)
        note_services.publish_note(self.note_a_id)

        self.assertEqual(
            note_services
            .get_total_number_of_published_note_summaries_by_author(
                self.user_id_a), 1)

        # Publishing note from user with user_id_b.
        change_dict: note_services.NoteChangeDict = {
            'title': 'Sample title B',
            'subtitle': '',
            'content': '<p>hi<p>'
        }
        note_services.update_note(
            self.note_b_id, change_dict)
        note_services.publish_note(self.note_b_id)

        self.assertEqual(
            note_services
            .get_total_number_of_published_note_summaries_by_author(
                self.user_id_a), 1)
        self.assertEqual(
            note_services
            .get_total_number_of_published_note_summaries_by_author(
                self.user_id_b), 1)

    def test_get_total_number_of_published_note_summaries(self) -> None:
        number_of_published_notes = (
            note_services.get_total_number_of_published_note_summaries()
        )
        self.assertEqual(number_of_published_notes, 0)
        note_services.update_note(
            self.note_a_id,
            self.change_dict_two)
        note_services.publish_note(self.note_a_id)
        number_of_published_notes = (
            note_services.get_total_number_of_published_note_summaries()
        )
        self.assertEqual(number_of_published_notes, 1)

    def test_get_published_note_summaries_by_user_id(self) -> None:
        self.assertEqual(
            len(note_services.get_published_note_summaries_by_user_id(
                self.user_id_a, 20, 0
            )),
            0
        )
        note_services.update_note(
            self.note_a_id,
            self.change_dict_two
        )
        note_services.publish_note(self.note_a_id)
        no_of_published_note = (
            note_services.get_published_note_summaries_by_user_id(
                self.user_id_a, 20, 0
            )
        )
        self.assertEqual(
            len(no_of_published_note), 1
        )

    def test_get_note_summary_from_model(self) -> None:
        note_summary_model = (
            note_models.NoteSummaryModel.get(self.note_a_id))
        note_summary = (
            note_services.get_note_summary_from_model(
                note_summary_model))
        expected_note_summary = (
            note_domain.NoteSummary(
                self.note_a_id,
                self.user_id_a,
                '',
                '',
                '',
                '',
                note_summary_model.last_updated,
                note_summary_model.published_on,
                note_summary_model.deleted
            )
        )
        self.assertEqual(
            note_summary.to_dict(), expected_note_summary.to_dict())

    def test_note_summary_by_id(self) -> None:
        note_summary = (
            note_services.get_note_summary_by_id(self.note_a_id)
        )
        expected_note_summary = (
            note_domain.NoteSummary(
                self.note_a_id,
                self.user_id_a,
                '',
                '',
                '',
                '',
                note_summary.last_updated,
                note_summary.published_on,
                note_summary.deleted
            )
        )
        self.assertEqual(
            note_summary.to_dict(), expected_note_summary.to_dict())

    def test_publish_note(self) -> None:
        note_rights = (
            note_services.get_note_rights(self.note_a_id))
        self.assertFalse(note_rights.note_is_published)

        note_services.update_note(
            self.note_a_id, self.change_dict_two)
        note_services.publish_note(self.note_a_id)
        note_summary = (
            note_services.get_note_summary_by_id(self.note_a_id))
        note = note_services.get_note_by_id(self.note_a_id)
        note_rights = (
            note_services.get_note_rights(self.note_a_id))

        self.assertTrue(note_rights.note_is_published)
        self.assertIsNotNone(note.published_on)
        self.assertIsNotNone(note_summary.published_on)
        self.assertEqual(
            note.published_on, note_summary.published_on)

    def test_cannot_publish_invalid_note(self) -> None:
        """Checks that an invalid note is not published."""
        with self.assertRaisesRegex(
                Exception, ('Title should not be empty')):
            note_services.publish_note(self.note_a_id)

        note_services.update_note(
            self.note_a_id, self.change_dict_one)

        change_dict_three: note_services.NoteChangeDict = {
            'title': 'Sample',
            'subtitle': '',
            'content': ''
        }

        note_services.update_note(self.note_a_id, change_dict_three)
        with self.assertRaisesRegex(
                Exception, ('Content can not be empty')):
            note_services.publish_note(self.note_a_id)

        note_services.delete_note(self.note_a_id)
        with self.assertRaisesRegex(
                Exception, ('The given note does not exist')):
            note_services.publish_note(self.note_a_id)

    def test_unpublish_note(self) -> None:
        note_services.update_note(
            self.note_a_id, self.change_dict_two)
        note_services.publish_note(self.note_a_id)
        note_rights = (
            note_services.get_note_rights(self.note_a_id))
        self.assertTrue(note_rights.note_is_published)

        note_services.unpublish_note(self.note_a_id)
        note_rights = (
            note_services.get_note_rights(self.note_a_id))
        self.assertFalse(note_rights.note_is_published)
        note_model = (
            note_services.get_note_by_id(self.note_a_id))
        self.assertIsNone(note_model.published_on)
        note_summary_model = (
            note_services.get_note_summary_by_id(self.note_a_id))
        self.assertIsNone(note_summary_model.published_on)

    def test_cannot_unpublish_invalid_note(self) -> None:
        note_services.delete_note(self.note_a_id)
        with self.assertRaisesRegex(
                Exception, ('The given note does not exist')):
            note_services.unpublish_note(self.note_a_id)

    def test_filter_note_ids(self) -> None:
        note_services.update_note(
            self.note_a_id, self.change_dict_two)
        note_services.publish_note(self.note_a_id)
        filtered_model_ids = (
            note_services.filter_note_ids(self.user_id_a, True))
        self.assertEqual(filtered_model_ids, [self.note_a_id])
        filtered_model_ids = (
            note_services.filter_note_ids(self.user_id_b, False))
        self.assertEqual(filtered_model_ids, [self.note_b_id])

    def test_update_note(self) -> None:
        self.assertEqual(self.note_a.title, '')
        note_services.update_note(
            self.note_a_id, self.change_dict_one)
        updated_note = (
            note_services.get_note_by_id(self.note_a_id))
        self.assertEqual(updated_note.content, '<p>Hello</p>')
        lower_id = '-' + self.note_a_id.lower()
        self.assertEqual(
            updated_note.url_fragment, 'sample-title' + lower_id)

        note_services.update_note(self.note_a_id, self.change_dict)

    def test_get_note_by_url_fragment(self) -> None:
        note_services.update_note(
            self.note_a_id, self.change_dict_one)
        expected_note = (
            note_services.get_note_by_id(self.note_a_id))
        lower_id = '-' + self.note_a_id.lower()
        note = note_services.get_note_by_url_fragment(
            'sample-title' + lower_id)
        # Ruling out the possibility of None for mypy type checking.
        assert note is not None
        self.assertEqual(note.to_dict(), expected_note.to_dict())

    def test_get_note_by_invalid_url(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
                Exception,
                'Note URL fragment should be a string. Recieved:'
                r'\[123\]'):
            note_services.does_note_with_url_fragment_exist([123])  # type: ignore[arg-type]

    def test_does_note_with_url_fragment_exist(self) -> None:
        note_services.update_note(
            self.note_a_id, self.change_dict_one)
        lower_id = '-' + self.note_a_id.lower()
        self.assertTrue(
            note_services.does_note_with_url_fragment_exist(
                'sample-title' + lower_id))
        self.assertFalse(
            note_services.does_note_with_url_fragment_exist('title'))

    def test_update_note_summary(self) -> None:
        note_summary = (
            note_services.get_note_summary_by_id(self.note_a_id)
        )
        self.assertEqual(note_summary.title, '')
        note_services.update_note(
            self.note_a_id, self.change_dict_one)
        updated_note_summary = (
            note_services.get_note_summary_by_id(self.note_a_id)
        )
        self.assertEqual(updated_note_summary.summary, 'Hello')
        lower_id = '-' + self.note_a_id.lower()
        self.assertEqual(
            updated_note_summary.url_fragment, 'sample-title' + lower_id)

    def test_generate_url_fragment(self) -> None:
        url_fragment = (
            note_services.generate_url_fragment(
                'Sample Url Fragment', 'ABC123EFG'))
        self.assertEqual(url_fragment, 'sample-url-fragment-abc123efg')

        url_fragment = (
            note_services.generate_url_fragment(
                'SaMple Url FrAgMent', 'ABC123Efgh'))
        self.assertEqual(url_fragment, 'sample-url-fragment-abc123efgh')

    def test_save_note_rights(self) -> None:
        note_rights = note_domain.NoteRights(
            self.note_a_id,
            [self.user_id_a, self.user_id_b],
            False
        )
        note_services.save_note_rights(note_rights)
        fetched_note_rights = (
            note_services.get_note_rights(self.note_a_id))
        self.assertEqual(
            note_rights.to_dict(), fetched_note_rights.to_dict())

    def test_delete_note(self) -> None:
        note_services.delete_note(self.note_a_id)
        self.assertIsNone(note_services.get_note_rights(
            self.note_a_id, strict=False))
        self.assertIsNone(note_services.get_note_by_id(
            self.note_a_id, strict=False))
        self.assertIsNone(note_services.get_note_summary_by_id(
            self.note_a_id, strict=False))

    def test_get_note_summary_by_title(self) -> None:
        model = (
            note_models.NoteSummaryModel.get_by_id(self.note_a_id))
        model.title = 'Hello Note'
        model.update_timestamps()
        model.put()

        note_summary = (
            note_services.get_note_summary_by_title('Hello Note'))
        # Ruling out the possibility of None for mypy type checking.
        assert note_summary is not None
        expected_note_summary = (
            note_domain.NoteSummary(
                self.note_a_id,
                self.user_id_a,
                'Hello Note',
                '',
                '',
                '',
                note_summary.last_updated,
                note_summary.published_on
            )
        )
        self.assertEqual(
            note_summary.to_dict(), expected_note_summary.to_dict())
        self.assertIsNone(note_services.get_note_summary_by_title('Hello'))

    def test_index_note_summaries_given_ids(self) -> None:
        all_note_ids = []
        for i in range(5):
            note = note_services.create_new_note(self.user_id_a)
            all_note_ids.append(note.id)
        expected_note_ids = all_note_ids[:-1]

        all_note_titles = [
            'title 0', 'title 1', 'title 2', 'title 3', 'title 4']
        expected_note_titles = all_note_titles[:-1]

        def mock_add_documents_to_index(
                docs: List[Dict[str, str]], index: int
        ) -> List[str]:
            self.assertEqual(index, note_services.SEARCH_INDEX_NOTES)
            ids = [doc['id'] for doc in docs]
            titles = [doc['title'] for doc in docs]
            self.assertEqual(set(ids), set(expected_note_ids))
            self.assertEqual(set(titles), set(expected_note_titles))
            return ids

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(
            search_services,
            'add_documents_to_index',
            add_docs_counter)

        for i in range(5):
            change_dict: note_services.NoteChangeDict = {
                'title': all_note_titles[i],
                'subtitle': '',
                'content': '<p>Hello note +</p>' + str(i),
            }
            note_services.update_note(
                all_note_ids[i],
                change_dict
            )

        # We're only publishing the first 4 notes, so we're not
        # expecting the last note to be indexed.
        for i in range(4):
            note_services.publish_note(all_note_ids[i])

        with add_docs_swap:
            note_services.index_note_summaries_given_ids(all_note_ids)

        self.assertEqual(add_docs_counter.times_called, 1)

    def test_updated_note_is_added_correctly_to_index(self) -> None:
        note = note_services.create_new_note(self.user_id_a)
        old_note_title = 'title 0'
        old_note_change_dict: note_services.NoteChangeDict = {
            'title': old_note_title,
            'subtitle': '',
            'content': '<p>Hello note</p>'
        }
        new_note_title = 'title 1'
        new_note_change_dict: note_services.NoteChangeDict = {
            'title': new_note_title,
            'subtitle': '',
            'content': '<p>Hello note</p>'
        }
        actual_docs = []

        def mock_add_documents_to_index(
                docs: List[Dict[str, str]], index: int
        ) -> None:
            self.assertEqual(index, note_services.SEARCH_INDEX_NOTES)
            actual_docs.extend(docs)

        add_docs_counter = test_utils.CallCounter(mock_add_documents_to_index)
        add_docs_swap = self.swap(
            search_services,
            'add_documents_to_index',
            add_docs_counter)

        with add_docs_swap:

            note_services.update_note(
                note.id,
                old_note_change_dict,
            )
            note_services.publish_note(note.id)
            old_note_summary = note_services.get_note_summary_by_id(
                note.id)
            if old_note_summary.published_on:
                rank = math.floor(
                    utils.get_time_in_millisecs(
                        old_note_summary.published_on))
            else:
                rank = 0
            initial_note_doc = {
                'id': note.id,
                'rank': rank,
                'title': old_note_title
            }
            self.assertEqual(actual_docs, [initial_note_doc])
            self.assertEqual(add_docs_counter.times_called, 1)

            actual_docs = []
            note_services.update_note(
                note.id,
                new_note_change_dict,
            )
            note_services.publish_note(note.id)
            new_note_summary = note_services.get_note_summary_by_id(
                note.id)
            if new_note_summary.published_on:
                rank = math.floor(
                    utils.get_time_in_millisecs(
                        new_note_summary.published_on))
            else:
                rank = 0
            updated_note_doc = {
                'id': note.id,
                'rank': rank,
                'title': new_note_title
            }

            self.process_and_flush_pending_tasks()
            self.assertEqual(actual_docs, [updated_note_doc])
            self.assertEqual(add_docs_counter.times_called, 2)
