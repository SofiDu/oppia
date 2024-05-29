# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Model for an Oppia note."""

from __future__ import annotations

from core import utils
from core.platform import models

from typing import Dict, List, Literal, Optional, Sequence, TypedDict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.USER
])

datastore_services = models.Registry.import_datastore_services()


class NoteModelDataDict(TypedDict):
    """Dictionary representing the export data of NoteModel."""

    title: str
    subtitle: str
    content: str
    url_fragment: str
    published_on: float


class NoteModel(base_models.BaseModel):
    """Model to store note data. All models are therefore not versioned.
    Note that note authors can always make edits directly to their note,
    and re-publish it.

    The id of instances of this class is in the form of random hash of 12 chars.
    """

    # We use the model id as a key in the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY: Literal[True] = True

    # The ID of the user the note is authored by.
    author_id = datastore_services.StringProperty(indexed=True, required=True)
    # Title of the note.
    title = datastore_services.StringProperty(indexed=True, required=True)
    # Subtitle of the note.
    subtitle = datastore_services.StringProperty(indexed=True, required=False)
    # Content of the note.
    content = datastore_services.TextProperty(indexed=False, required=True)
    # The unique url fragment of the note. If the user directly enters the
    # note's url in the editor or the homepage, the NoteModel will be
    # queried using the url fragment to retrieve data for populating the editor
    # dashboard / note page.
    url_fragment = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Time when the blog post model was last published. Value will be None
    # if the blog post is not currently published.
    published_on = (
        datastore_services.DateTimeProperty(indexed=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize corresponding to a user:
        author_id field.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether NoteModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.author_id == user_id
        ).get(keys_only=True) is not None

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as multiple instances per user since there can
        be multiple note models relevant to a user.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user to export."""
        return dict(super(NoteModel, cls).get_export_policy(), **{
            # We do not export the author_id because we should not
            # export internal user ids.
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.EXPORTED,
            'subtitle': base_models.EXPORT_POLICY.EXPORTED,
            'content': base_models.EXPORT_POLICY.EXPORTED,
            'url_fragment': base_models.EXPORT_POLICY.EXPORTED,
            'published_on': base_models.EXPORT_POLICY.EXPORTED,
        })

    @classmethod
    def generate_new_note_id(cls) -> str:
        """Generates a new note ID which is unique and is in the form of
        random hash of 12 chars.

        Returns:
            str. A note ID that is different from the IDs of all
            the existing notes.

        Raises:
            Exception. There were too many collisions with existing note
                IDs when attempting to generate a new note ID.
        """
        for _ in range(base_models.MAX_RETRIES):
            note_id = utils.convert_to_hash(
                str(utils.get_random_int(base_models.RAND_RANGE)),
                base_models.ID_LENGTH)
            if not cls.get_by_id(note_id):
                return note_id
        raise Exception(
            'New note id generator is producing too many collisions.')

    @classmethod
    def create(cls, note_id: str, author_id: str) -> NoteModel:
        """Creates a new NoteModel entry.

        Args:
            note_id: str. Note ID of the newly-created note.
            author_id: str. User ID of the author.

        Returns:
            NoteModel. The newly created NoteModel instance.

        Raises:
            Exception. A note with the given note ID exists already.
        """
        if cls.get_by_id(note_id):
            raise Exception(
                'A note with the given note ID exists already.')

        entity = cls(
            id=note_id,
            author_id=author_id,
            content='',
            title='',
            subtitle='',
            url_fragment='',
        )
        entity.update_timestamps()
        entity.put()

        return entity

    @classmethod
    def get_by_url_fragment(cls, url_fragment: str) -> Optional[NoteModel]:
        """Gets NoteModel by url_fragment. Returns None if the note
        with the given url_fragment doesn't exist.

        Args:
            url_fragment: str. The url fragment of the note.

        Returns:
            BlogPostModel | None. The note model of the Blog or None if not
            found.
        """
        return NoteModel.query(
            datastore_services.all_of(
                cls.url_fragment == url_fragment, cls.deleted == False) # pylint: disable=singleton-comparison
        ).get()

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, NoteModelDataDict]:
        """Exports the data from NoteModel into dict format for Takeout.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. Dictionary of the data from NoteModel.
        """
        user_data: Dict[str, NoteModelDataDict] = {}
        note_models: Sequence[NoteModel] = cls.get_all().filter(
            cls.author_id == user_id).fetch()
        for note_model in note_models:
            user_data[note_model.id] = {
                'title': note_model.title,
                'subtitle': note_model.subtitle,
                'content': note_model.content,
                'url_fragment': note_model.url_fragment,
                'published_on': utils.get_time_in_millisecs(
                    note_model.published_on),
            }

        return user_data


class NoteSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia note.

    This should be used whenever the content of the note is not
        needed (e.g. in search results, etc).

    A NoteSummaryModel instance stores the following information:

        id, title, subtitle, language_code, tags,
        last_updated, created_on, status (private, public),
        owner_ids, editor_ids,viewer_ids, version.

    The key of each instance is the note id.
    """

    # The ID of the user the note is authored by.
    author_id = datastore_services.StringProperty(indexed=True, required=True)
    # The title of this note.
    title = datastore_services.StringProperty(required=True)
    # The subtitle of this note.
    subtitle = datastore_services.TextProperty(required=False)
    # Autogenerated summary of the note.
    summary = datastore_services.StringProperty(required=True, default='')
    # The unique url fragment of the note.
    url_fragment = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Time when the blog post model was last published. Value will be None
    # if the blog post is currently not published.
    published_on = datastore_services.DateTimeProperty(indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: author_id field.
        """
        return (
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE
        )

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether NoteSummaryModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.author_id == user_id
        ).get(keys_only=True) is not None

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model data has already been exported as a part of the
        NoteModel and thus does not need a separate export.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because noteworthy details that belong to this model have
        already been exported as a part of the NoteModel.
        """
        return dict(super(NoteSummaryModel, cls).get_export_policy(), **{
            'author_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subtitle': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'summary': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'url_fragment': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'published_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        })


class NoteRightsModel(base_models.BaseModel):
    """Storage model for rights related to a Note.

    The id of each instance is the id of the corresponding note.
    """

    # The user_ids of users who are allowed to edit this note.
    editor_ids = datastore_services.StringProperty(indexed=True, repeated=True)

    # Whether this note is published or not.
    # False if note is a draft, True if published.
    note_is_published = datastore_services.BooleanProperty(
        indexed=True, required=True, default=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to be deleted corresponding to a user: editor_ids
        field. It does not delete the model but removes the user id from the
        list of editor IDs corresponding to a blog post rights model.
        """
        return (
            base_models.DELETION_POLICY.DELETE
        )

    @classmethod
    def deassign_user_from_all_notes(cls, user_id: str) -> None:
        """Removes user_id from the list of editor_ids from all the blog
        post rights models.

        Args:
            user_id: str. The ID of the user to be removed from editor ids.
        """
        note_rights_models = cls.get_all_by_user(user_id)
        if note_rights_models:
            for rights_model in note_rights_models:
                rights_model.editor_ids.remove(user_id)
            cls.update_timestamps_multi(note_rights_models)
            cls.put_multi(note_rights_models)

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether NoteRightsModel references to the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            # NOTE: Even though `editor_ids` is repeated, we can compare it to a
            # single value and it will return models where any of the editor IDs
            # are equal to user_id.
            cls.editor_ids == user_id).get(keys_only=True) is not None

    @classmethod
    def get_published_models_by_user(
        cls,
        user_id: str,
        offset: int = 0,
        limit: Optional[int] = None,
    ) -> List[NoteRightsModel]:
        """Retrieves the note rights objects for published note for
        which the given user is an editor.

        Args:
            user_id: str. ID of the author of the note.
            offset: int|None. Number of query results to skip from top. If None,
                all results from top will be returned.
            limit: int|None. The maximum number of NoteRightsModels to be
                fetched. If None, all existing published models by user will be
                fetched.

        Returns:
            list(NoteRightsModel). The list of NoteRightsModel objects
            in which the given user is an editor. The list will be ordered
            according to the time when the model was last updated.
        """
        query = cls.query(
            cls.editor_ids == user_id, cls.note_is_published == True # pylint: disable=singleton-comparison
        ).order(-cls.last_updated)
        return list(
            query.fetch(
                limit, offset=offset
            ) if limit is not None else query.fetch(offset=offset)
        )

    @classmethod
    def get_draft_models_by_user(
        cls,
        user_id: str,
        limit: Optional[int] = None
    ) -> List[NoteRightsModel]:
        """Retrieves the note rights objects for draft blog posts for which
        the given user is an editor.

        Args:
            user_id: str. ID of the author of the note.
            limit: int|None. The maximum number of NoteRightsModels to be
                fetched. If None, all existing draft models by user will be
                fetched.

        Returns:
            list(NoteRightsModel). The list of NoteRightsModel objects
            in which the given user is an editor. The list will be ordered
            according to the time when the model was last updated.
        """
        query = cls.query(
            cls.editor_ids == user_id, cls.note_is_published == False # pylint: disable=singleton-comparison
        ).order(-cls.last_updated)
        return list(
            query.fetch(limit) if limit is not None else query.fetch()
        )

    @classmethod
    def get_all_by_user(cls, user_id: str) -> List[NoteRightsModel]:
        """Retrieves the note rights objects for all blog posts for which
        the given user is an editor.

        Args:
            user_id: str. ID of the author of the note.

        Returns:
            list(NoteRightsModel). The list of NoteRightsModel objects
            in which the given user is an editor.
        """
        return list(cls.query(cls.editor_ids == user_id).fetch())

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance shared across users since multiple
        users can edit the blog post.
        """
        return (
            base_models.MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS
        )

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export corresponding to a user."""
        return dict(super(NoteRightsModel, cls).get_export_policy(), **{
            'editor_ids': base_models.EXPORT_POLICY.EXPORTED,
            'note_is_published': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, List[str]]:
        """(Takeout) Export user-relevant properties of NoteRightsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. The user-relevant properties of NoteRightsModel.
            in a python dict format. In this case, we are returning all the
            ids of blog posts for which the user is an editor.
        """
        editable_notes: Sequence[NoteRightsModel] = (
            cls.query(cls.editor_ids == user_id).fetch())
        editable_note_ids = [note.id for note in editable_notes]

        return {
            'editable_note_ids': editable_note_ids,
        }

    @classmethod
    def get_field_name_mapping_to_takeout_keys(cls) -> Dict[str, str]:
        """Defines the mapping of field names to takeout keys since this model
        is exported as one instance shared across users.
        """
        return {
            'editor_ids': 'editable_note_ids',
        }

    @classmethod
    def create(cls, note_id: str, author_id: str) -> NoteRightsModel:
        """Creates a new NoteRightsModel entry.

        Args:
            note_id: str. Note ID of the newly-created note.
            author_id: str. User ID of the author.

        Returns:
            NoteRightsModel. The newly created NoteRightsModel
            instance.

        Raises:
            Exception. A note rights model with the given blog post ID
                exists already.
        """
        if cls.get_by_id(note_id):
            raise Exception(
                'Note ID conflict on creating new note rights model.')

        entity = cls(
            id=note_id,
            editor_ids=[author_id]
        )
        entity.update_timestamps()
        entity.put()

        return entity
