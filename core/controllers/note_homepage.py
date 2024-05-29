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

"""Controllers for the note homepage."""

from __future__ import annotations

import logging

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import note_domain
from core.domain import note_services
from core.domain import user_services

from typing import Dict, Final, List, Optional, Tuple, TypedDict

NOTE_ADMIN: Final = feconf.ROLE_ID_NOTE_ADMIN
NOTE_EDITOR: Final = feconf.ROLE_ID_NOTE_EDITOR
MAX_CHARS_IN_NOTE_URL: Final = feconf.MAX_CHARS_IN_BLOG_POST_URL


class NoteCardSummaryDict(TypedDict):
    """Type for the dict representation of note_card_summary_dict."""

    id: str
    title: str
    subtitle: str
    summary: str
    author_username: Optional[str]
    url_fragment: str
    last_updated: Optional[str]
    published_on: Optional[str]


def _get_note_card_summary_dicts_for_homepage(
        summaries: List[note_domain.NoteSummary]
) -> List[NoteCardSummaryDict]:
    """Creates summary dicts for use in note homepage.

    Args:
        summaries: list(NoteSummary). List of note post summary
            domain objects.

    Returns:
        list(dict). The list of note post summary dicts.
    """
    summary_dicts: List[NoteCardSummaryDict] = []
    for summary in summaries:
        summary_dict = summary.to_dict()
        user_settings = user_services.get_user_settings(
            summary_dict['author_id'], strict=False)
        if user_settings:
            card_summary_dict: NoteCardSummaryDict = {
                'id': summary_dict['id'],
                'title': summary_dict['title'],
                'subtitle': summary_dict['subtitle'],
                'summary': summary_dict['summary'],
                'author_username': user_settings.username,
                'url_fragment': summary_dict['url_fragment'],
                'published_on': summary_dict['published_on'],
                'last_updated': summary_dict['last_updated'],
            }
        else:
            card_summary_dict = {
                'id': summary_dict['id'],
                'title': summary_dict['title'],
                'subtitle': summary_dict['subtitle'],
                'summary': summary_dict['summary'],
                'author_username': 'author account deleted',
                'url_fragment': summary_dict['url_fragment'],
                'published_on': summary_dict['published_on'],
                'last_updated': summary_dict['last_updated'],
            }
        summary_dicts.append(card_summary_dict)
    return summary_dicts


def _get_matching_note_card_summary_dicts(
        query_string: str, size: int, search_offset: Optional[int]
) -> Tuple[List[note_domain.NoteSummary], Optional[int]]:
    """Given the details of a query and a search offset, returns a list of
    matching note card summary domain objects that satisfy the query.

    Args:
        query_string: str. The search query string (this is what the user
            enters).
        size: int. The maximum number of note post summary domain objects to
            be returned.
        search_offset: int or None. Offset indicating where, in the list of
            note post summaries search results, to start the search from.
            If None, note post summaries search results are returned from
            beginning.

    Returns:
        tuple. A tuple consisting of two elements:
            - list(dict). Each element in this list is a note post summary
            domain object, representing a search result to popoulate data on
            note card.
            - int. The note post search index offset from which to start the
                next search.
    """
    note_ids, new_search_offset = (
        note_services.get_note_ids_matching_query(
            query_string, size, offset=search_offset))
    note_summaries = (
        note_services.get_note_summary_models_by_ids(note_ids))
    if len(note_summaries) == feconf.DEFAULT_QUERY_LIMIT:
        logging.error(
            '%s note post summaries were fetched to load the search/filter by '
            'result page. You may be running up against the default query '
            'limits.'
            % feconf.DEFAULT_QUERY_LIMIT)
    return note_summaries, new_search_offset


class NoteHomepageDataHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of NoteHomepageDataHandler's normalized_request
    dictionary.
    """

    offset: str


class NoteHomepageDataHandler(
    base.BaseHandler[
        Dict[str, str],
        NoteHomepageDataHandlerNormalizedRequestDict
    ]
):
    """Provides note cards data and default tags data for the note homepage."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'offset': {
                'schema': {
                    'type': 'basestring'
                },
            }
        }
    }

    @acl_decorators.open_access
    def get(self) -> None:
        """Retrieves note post summaries for the note homepage."""
        assert self.normalized_request is not None
        offset = int(self.normalized_request['offset'])
        published_summaries = (
            note_services.get_published_note_summaries(offset))
        published_summary_dicts = []
        if published_summaries:
            published_summary_dicts = (
                _get_note_card_summary_dicts_for_homepage(
                    published_summaries))
        # Total number of published note posts is calculated only when we load
        # the note home page for the first time (search offset will be 0).
        # It is not required to load other subsequent pages as the value is
        # already loaded in the frontend.
        if offset != 0:
            self.values.update({
                'note_summary_dicts': published_summary_dicts,
            })
            self.render_json(self.values)
        else:
            self.render_json(self.values)


class NoteDataHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides note post data for the note post page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'note_url': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'has_length_at_most',
                    'max_value': MAX_CHARS_IN_NOTE_URL
                },
                    {
                        'id': 'has_length_at_least',
                        'min_value': constants.NOTE_ID_LENGTH
                    }]
            },
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}


class AuthorsPageHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Provides note cards data and author data for the authors page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'author_username': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'offset': {
                'schema': {
                    'type': 'basestring'
                },
            }
        },
    }

    @acl_decorators.open_access
    def get(self, author_username: str) -> None:
        """Retrieves note post summaries and specific author details.

        Args:
            author_username: str. The username of the author.

        Raises:
            Exception. No user settings found for the given author_username.
        """
        assert self.normalized_request is not None
        offset = int(self.normalized_request['offset'])

        user_settings = (
            user_services.get_user_settings_from_username(author_username)
        )
        if user_settings is None:
            raise Exception(
                'No user settings found for the given author_username: %s' %
                author_username
            )

        num_of_published_note_summaries = (
            note_services
            .get_total_number_of_published_note_summaries_by_author(
                user_settings.user_id
            )
        )
        note_summaries = (
            note_services.get_published_note_summaries_by_user_id(
                user_settings.user_id,
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_AUTHOR_PROFILE_PAGE,
                offset
            )
        )
        note_summary_dicts = []
        if note_summaries:
            note_summary_dicts = (
                _get_note_card_summary_dicts_for_homepage(
                    note_summaries))

        self.values.update({
            'no_of_note_summaries': num_of_published_note_summaries,
            'summary_dicts': note_summary_dicts
        })
        self.render_json(self.values)


class NoteSearchHandlerNormalizedRequestDict(TypedDict):
    """Dict representation of NoteSearchHandler's normalized_request
    dictionary.
    """

    q: str
    tags: str
    offset: Optional[int]


class NoteSearchHandler(
    base.BaseHandler[
        Dict[str, str],
        NoteSearchHandlerNormalizedRequestDict
    ]
):
    """Provides note cards for note search page based on query provided and
    applied tag filters.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'q': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': ''
            },
            'tags': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_search_query_string'
                    }, {
                        'id': 'is_regex_matched',
                        'regex_pattern': '[\\-\\w+()"\\s]*'
                    }]
                },
                'default_value': ''
            },
            'offset': {
                'schema': {
                    'type': 'int'
                },
                'default_value': None
            }
        }
    }
