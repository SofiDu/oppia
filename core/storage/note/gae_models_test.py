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

"""Tests for Note models."""

from __future__ import annotations

import datetime
import types

from core import utils
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import note_models

(base_models, note_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.NOTE, models.Names.USER
])


class NoteModelTest(test_utils.GenericTestBase):
    """Tests for the NoteModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID: Final = 'user_1'
    CONTENT: Final = 'Dummy Content'
    TITLE: Final = 'Dummy Title'
    SUBTITLE: Final = 'Dummy Subtitle'

    def setUp(self) -> None:
        """Set up note models in datastore for use in testing."""
        super().setUp()

        self.note_model = note_models.NoteModel(
            id='note_one',
            author_id=self.USER_ID,
            content=self.CONTENT,
            title=self.TITLE,
            subtitle=self.SUBTITLE,
            published_on=datetime.datetime.utcnow(),
            url_fragment='sample-url-fragment'
        )
        self.note_model.update_timestamps()
        self.note_model.put()

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            note_models.NoteModel.
            get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.EXPORTED,
            'subtitle': base_models.EXPORT_POLICY.EXPORTED,
            'content': base_models.EXPORT_POLICY.EXPORTED,
            'url_fragment': base_models.EXPORT_POLICY.EXPORTED,
            'published_on': base_models.EXPORT_POLICY.EXPORTED,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            note_models.NoteModel.get_export_policy(),
            expected_export_policy_dict)

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            note_models.NoteModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            note_models.NoteModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            note_models.NoteModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_raise_exception_by_mocking_collision(self) -> None:
        """Tests create and generate_new_note_id methods for raising
        exception.
        """
        note_model_cls = note_models.NoteModel

        # Test create method.
        with self.assertRaisesRegex(
                Exception,
                'A note with the given note ID exists already.'):

            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                    note_model_cls, 'get_by_id',
                    types.MethodType(
                        lambda x, y: True,
                        note_model_cls)):
                note_model_cls.create(
                    'note_id', self.USER_ID)

        # Test generate_new_note_id method.
        with self.assertRaisesRegex(
                Exception,
                'New note id generator is producing too many collisions.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                    note_model_cls, 'get_by_id',
                    types.MethodType(
                        lambda x, y: True,
                        note_model_cls)):
                note_model_cls.generate_new_note_id()

    def test_get_by_url_fragment(self) -> None:
        self.assertEqual(
            note_models.NoteModel.get_by_url_fragment(
                'sample-url-fragment'),
            self.note_model
        )

    def test_creating_new_note_model_instance(self) -> None:
        note_model_id = (
            note_models.NoteModel.generate_new_note_id())
        note_model_instance = (
            note_models.NoteModel.create(
                note_model_id, self.USER_ID))
        self.assertEqual(note_model_instance.id, note_model_id)
        self.assertEqual(note_model_instance.author_id, self.USER_ID)

    def test_export_data_trivial(self) -> None:
        user_data = note_models.NoteModel.export_data(
            self.NONEXISTENT_USER_ID
        )
        test_data: Dict[str, note_models.NoteModelDataDict] = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self) -> None:
        user_data = note_models.NoteModel.export_data(self.USER_ID)
        note_id = 'note_one'
        test_data = {
            note_id: {
                'title': self.TITLE,
                'subtitle': self.SUBTITLE,
                'content': self.CONTENT,
                'url_fragment': 'sample-url-fragment',
                'published_on': utils.get_time_in_millisecs(
                    self.note_model.published_on)
            }
        }
        self.assertEqual(user_data, test_data)


class NoteSummaryModelTest(test_utils.GenericTestBase):
    """Tests for the NoteSummaryModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID: Final = 'user_1'
    SUMMARY: Final = 'Dummy Summary'
    TITLE: Final = 'Dummy Title'
    SUBTITLE: Final = 'Dummy Subitle'

    def setUp(self) -> None:
        """Set up models in datastore for use in testing."""
        super().setUp()

        self.note_summary_model_old = (
            note_models.NoteSummaryModel(
                id='note_one',
                author_id=self.USER_ID,
                summary=self.SUMMARY,
                title=self.TITLE,
                published_on=datetime.datetime.utcnow(),
                url_fragment='sample-url-fragment'
            ))
        self.note_summary_model_old.update_timestamps()
        self.note_summary_model_old.put()

        self.note_summary_model_new = (
            note_models.NoteSummaryModel(
                id='note_two',
                author_id=self.USER_ID,
                summary='sample summary',
                title='Sample Tile',
                published_on=datetime.datetime.utcnow(),
                url_fragment='sample-url-fragment-two'
            ))
        self.note_summary_model_new.update_timestamps()
        self.note_summary_model_new.put()

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subtitle': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'summary': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'published_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            note_models.NoteSummaryModel.get_export_policy(),
            expected_export_policy_dict)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            note_models.NoteSummaryModel.
            get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            note_models.NoteSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            note_models.NoteSummaryModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            note_models.NoteSummaryModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_get_note_summary_models(self) -> None:
        note_ids = ['note_two', 'note_one']
        note_summary_models = (
            note_models.NoteSummaryModel.get_multi(note_ids))
        self.assertEqual(len(note_summary_models), 2)
        self.assertEqual(
            note_summary_models[0], self.note_summary_model_new)
        self.assertEqual(
            note_summary_models[1], self.note_summary_model_old)


class NoteRightsModelTest(test_utils.GenericTestBase):
    """Tests for the NoteRightsModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID: Final = 'user_1'
    USER_ID_NEW: Final = 'user_2'
    USER_ID_OLD: Final = 'user_3'
    NOTE_ID_NEW: Final = 'note_id'
    NOTE_ID_OLD: Final = 'note_old_id'

    def setUp(self) -> None:
        super().setUp()
        self.note_rights_model = note_models.NoteRightsModel(
            id=self.NOTE_ID_NEW,
            editor_ids=[self.USER_ID_NEW],
            note_is_published=True,
        )
        self.note_rights_model.update_timestamps()
        self.note_rights_model.put()

        self.note_rights_draft_model = note_models.NoteRightsModel(
            id=self.NOTE_ID_OLD,
            editor_ids=[self.USER_ID_OLD, self.USER_ID_NEW, self.USER_ID],
            note_is_published=False,
        )
        self.note_rights_draft_model.update_timestamps()
        self.note_rights_draft_model.put()

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'editor_ids': base_models.EXPORT_POLICY.EXPORTED,
            'note_is_published': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            note_models.NoteRightsModel.get_export_policy(),
            expected_export_policy_dict)

    def test_get_field_name_mapping_to_takeout_keys(self) -> None:
        self.assertEqual(
            note_models.NoteRightsModel.
            get_field_name_mapping_to_takeout_keys(),
            {
                'editor_ids': 'editable_note_ids'
            })

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            note_models.NoteRightsModel.
            get_model_association_to_user(),
            base_models.
            MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_SHARED_ACROSS_USERS)

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            note_models.NoteRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            note_models.NoteRightsModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertTrue(
            note_models.NoteRightsModel
            .has_reference_to_user_id(self.USER_ID_NEW))
        self.assertFalse(
            note_models.NoteRightsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_get_all_by_user_for_fetching_all_rights_model(self) -> None:
        self.assertEqual(
            note_models.NoteRightsModel.get_all_by_user(self.USER_ID_NEW),
            [self.note_rights_model, self.note_rights_draft_model])
        self.assertEqual(
            note_models.NoteRightsModel.get_all_by_user(self.USER_ID),
            [self.note_rights_draft_model])
