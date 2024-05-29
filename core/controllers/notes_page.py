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

"""Controllers for the notes page"""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import note_domain
from core.domain import note_services

from typing import Dict, List, Optional, TypedDict


class NotesCardSummaryDict(TypedDict):
    """Type for the dict representation of note_card_summary_dict."""

    id: str
    title: str
    subtitle: str
    summary: str
    url_fragment: str
    last_updated: Optional[str]
    published_on: Optional[str]


def _get_note_card_summary_dicts_for_dashboard(
        summaries: List[note_domain.NoteSummary]
) -> List[NotesCardSummaryDict]:
    """Creates summary dicts for use in notes.

    Args:
        summaries: list(NotesPostSummary). List of note post summary
            domain objects.

    Returns:
        list(NotesCardSummaryDict). The list of note post summary dicts.
    """
    summary_dicts: List[NotesCardSummaryDict] = []
    for summary in summaries:
        summary_dict = summary.to_dict()
        summary_dicts.append({
            'id': summary_dict['id'],
            'title': summary_dict['title'],
            'subtitle': summary_dict['subtitle'],
            'summary': summary_dict['summary'],
            'url_fragment': summary_dict['url_fragment'],
            'last_updated': summary_dict['last_updated'],
            'published_on': summary_dict['published_on'],
        })
    return summary_dicts


class NotesPageDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides user data for the notes."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {},
        'PUT': {
            'displayed_author_name': {
                'schema': {
                    'type': 'basestring',
                },
            },
        },
    }

    @acl_decorators.can_access_notes_page
    def get(self) -> None:
        """Retrieves data for the notes."""
        assert self.user_id is not None
        no_of_published_notes = 0
        published_post_summary_dicts = []
        no_of_draft_notes = 0
        draft_note_summary_dicts = []
        published_post_summaries = (
            note_services.get_note_summary_models_list_by_user_id(
                self.user_id, True))
        if published_post_summaries:
            no_of_published_notes = len(published_post_summaries)
            published_post_summary_dicts = (
                _get_note_card_summary_dicts_for_dashboard(
                    published_post_summaries))

        draft_note_summaries = (
            note_services.get_note_summary_models_list_by_user_id(
                self.user_id, False))
        if draft_note_summaries:
            no_of_draft_notes = len(draft_note_summaries)
            draft_note_summary_dicts = (
                _get_note_card_summary_dicts_for_dashboard(
                    draft_note_summaries))
        self.values.update({
            'no_of_published_notes': no_of_published_notes,
            'no_of_draft_notes': no_of_draft_notes,
            'published_note_summary_dicts': published_post_summary_dicts,
            'draft_note_summary_dicts': draft_note_summary_dicts
        })

        self.render_json(self.values)

    @acl_decorators.can_access_notes_page
    def post(self) -> None:
        """Creates a new note post draft."""
        assert self.user_id is not None
        new_note = note_services.create_new_note(self.user_id)
        self.render_json({'note_id': new_note.id})


class NotesPostHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of NotesPostHandler's normalized_payload
    dictionary.
    """

    change_dict: note_services.NoteChangeDict
    new_publish_status: str
    thumbnail_filename: str


class NotesPostHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of NotesPostHandler's normalized_request
    dictionary.
    """

    image: bytes


class NotesPostHandler(
    base.BaseHandler[
        NotesPostHandlerNormalizedPayloadDict,
        NotesPostHandlerNormalizedRequestDict
    ]
):
    """Handler for notes editor"""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'note_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.NOTE_ID_LENGTH
                    },
                    {
                        'id': 'has_length_at_least',
                        'min_value': constants.NOTE_ID_LENGTH
                    }
                ]
            },
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'new_publish_status': {
                'schema': {
                    'type': 'bool',
                }
            },
            'change_dict': {
                'schema': {
                    'type': 'object_dict'
                }
            },
        },
        'POST': {},
        'DELETE': {}
    }

    @acl_decorators.can_access_notes_page
    def get(self, note_id: str) -> None:
        """Populates the data on the notes editor page.

        Args:
            note_id: str. The ID of the note post.

        Raises:
            PageNotFoundException. The note post with the given id
                or url doesn't exist.
        """
        note = (
            note_services.get_note_by_id(note_id, strict=False))

        if note is None:
            raise self.NotFoundException(
                'The note post with the given id or url doesn\'t exist.')

        note_dict = note.to_dict()
        note_dict_for_dashboard = {
            'id': note_dict['id'],
            'title': note_dict['title'],
            'subtitle': note_dict['subtitle'],
            'content': note_dict['content'],
            'url_fragment': note_dict['url_fragment'],
            'last_updated': note_dict['last_updated'],
            'published_on': note_dict['published_on'],
        }
        self.values.update({
            'note_dict': note_dict_for_dashboard
        })

        self.render_json(self.values)

    @acl_decorators.can_edit_note
    def put(self, note_id: str) -> None:
        """Updates properties of the given note post.

        Args:
            note_id: str. The ID of the note post.
        """
        assert self.normalized_payload is not None
        note_rights = (
            note_services.get_note_rights(note_id, strict=True))
        note_currently_published = note_rights.note_is_published
        change_dict = self.normalized_payload['change_dict']
        note_services.update_note(note_id, change_dict)
        new_publish_status = self.normalized_payload['new_publish_status']
        if new_publish_status:
            note_services.publish_note(note_id)
        elif note_currently_published:
            note_services.unpublish_note(note_id)

        note_dict = (
            note_services.get_note_by_id(note_id).to_dict())

        self.values.update({
            'note': note_dict
        })
        self.render_json(self.values)

    @acl_decorators.can_delete_note
    def delete(self, note_id: str) -> None:
        """Deletes a note post.

        Args:
            note_id: str. The ID of the note post.
        """
        note_services.delete_note(note_id)
        self.render_json(self.values)


class NotesPostTitleHandlerNormalizedDict(TypedDict):
    """Dict representation of NotesPostTitleHandler's normalized_request
    and payload dictionary.
    """

    title: str


class NotesPostTitleHandler(
    base.BaseHandler[
        NotesPostTitleHandlerNormalizedDict,
        NotesPostTitleHandlerNormalizedDict
    ]
):
    """A data handler for checking if a note post with given title exists."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'note_id': {
            'schema': {
                'type': 'basestring',
                'validators': [
                    {
                        'id': 'has_length_at_most',
                        'max_value': constants.NOTE_ID_LENGTH
                    },
                    {
                        'id': 'has_length_at_least',
                        'min_value': constants.NOTE_ID_LENGTH,
                    }
                ]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'title': {
                'schema': {
                    'type': 'basestring',
                    'validators': [
                        {
                            'id': 'has_length_at_most',
                            'max_value': constants.MAX_CHARS_NOTE_TITLE
                        }
                    ]
                }
            }
        },
    }

    @acl_decorators.can_edit_note
    def get(self, note_id: str) -> None:
        """Handler that receives a note post title and checks whether
        a note post with the same title exists.

        Args:
            note_id: str. The ID of the note post.
        """
        assert self.normalized_request is not None
        title = self.normalized_request['title']
        self.render_json({
            'note_exists': (
                note_services.does_note_with_title_exist(
                    title, note_id
                )
            )
        })
