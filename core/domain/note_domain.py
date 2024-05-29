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

"""Domain objects relating to notes.
"""

from __future__ import annotations

import datetime
import re

from core import utils
from core.constants import constants

from typing import Final, List, Optional, TypedDict

from core.domain import html_cleaner  # pylint: disable=invalid-import-from # isort:skip

MAX_CHARS_IN_NOTE_URL_FRAGMENT: Final = (
    constants.MAX_CHARS_IN_NOTE_TITLE
    + len('-')
    + constants.NOTE_ID_LENGTH
)


class NoteDict(TypedDict):
    """Dictionary representing the Note object."""

    id: str
    title: str
    subtitle: str
    author_id: str
    content: str
    url_fragment: str
    last_updated: Optional[str]
    published_on: Optional[str]


class NoteRightsDict(TypedDict):
    """Dict type for NoteRights object."""

    note_id: str
    editor_ids: List[str]
    note_is_published: bool


class NoteSummaryDict(TypedDict):
    """Dict type for NoteSummary object."""

    id: str
    title: str
    subtitle: str
    author_id: str
    summary: str
    url_fragment: str
    last_updated: Optional[str]
    published_on: Optional[str]


class Note:
    """Domain object for an Oppia Note."""

    def __init__(
        self,
        note_id: str,
        author_id: str,
        title: str,
        subtitle: str,
        content: str,
        url_fragment: str,
        last_updated: Optional[datetime.datetime] = None,
        published_on: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a Note domain object.

        Args:
            note_id: str. The unique ID of the note.
            author_id: str. The user ID of the author.
            title: str. The title of the note.
            subtitle: str. The subtitle of the note.
            content: str. The html content of the note.
            url_fragment: str. The url fragment for the note.
            last_updated: datetime.datetime. Date and time when the note
                was last updated.
            published_on: datetime.datetime. Date and time when the note is
                last published.
        """
        self.id = note_id
        self.author_id = author_id
        self.title = title
        self.subtitle = subtitle
        self.content = html_cleaner.clean(content)
        self.url_fragment = url_fragment
        self.last_updated = last_updated
        self.published_on = published_on

    def validate(self, strict: bool = False) -> None:
        """Validates various properties of the note object.

        Args:
            strict: bool. Enable strict checks on the note when the note
                is published or is going to be published.

        Raises:
            ValidationError. One or more attributes of note are invalid.
        """
        self.require_valid_title(self.title, strict)

        if strict:
            self.require_valid_url_fragment(self.url_fragment)
            if not self.content:
                raise utils.ValidationError('Content can not be empty')

        if not isinstance(self.content, str):
            raise utils.ValidationError(
                'Expected contents to be a string, received: %s' % self.content)

    @classmethod
    def require_valid_title(cls, title: str, strict: bool) -> None:
        """Checks whether the note title is a valid one.

        Args:
            title: str. The title to validate.
            strict: bool. Enable strict checks on the note when the note
                is published or is going to be published.

        Raises:
            ValidationErrors. Title provided is invalid.
        """
        if not isinstance(title, str):
            raise utils.ValidationError('Title should be a string.')

        if len(title) > constants.MAX_CHARS_IN_NOTE_TITLE:
            raise utils.ValidationError(
                'Note title should at most have %d chars, received: %s'
                % (constants.MAX_CHARS_IN_NOTE_TITLE, title))

        if strict:
            if not title:
                raise utils.ValidationError('Title should not be empty')

            if not re.match(constants.VALID_NOTE_TITLE_REGEX, title):
                raise utils.ValidationError(
                    'Title field contains invalid characters. Only words '
                    '(a-zA-Z0-9(\'!)) separated by spaces, hyphens (-), comma ('
                    ',), ampersand (&) and colon (:) are allowed.'
                    'Received %s' % title)

    @classmethod
    def require_valid_url_fragment(cls, url_fragment: str) -> None:
        """Checks whether the url fragment of the note is a valid one.

        Args:
            url_fragment: str. The url fragment to validate.

        Raises:
            ValidationErrors. URL fragment provided is invalid.
        """
        if not isinstance(url_fragment, str):
            raise utils.ValidationError(
                'Note URL Fragment field must be a string. '
                'Received %s.' % (url_fragment)
            )

        if not url_fragment:
            raise utils.ValidationError(
                'Note URL Fragment field should not be empty.')

        if len(url_fragment) > MAX_CHARS_IN_NOTE_URL_FRAGMENT:
            raise utils.ValidationError(
                'Note URL Fragment field should not exceed %d characters.'
                % MAX_CHARS_IN_NOTE_URL_FRAGMENT
            )

        if not re.match(constants.VALID_URL_NOTE_FRAGMENT_REGEX, url_fragment):
            raise utils.ValidationError(
                'Note URL Fragment field contains invalid characters.'
                'Only lowercase words, numbers separated by hyphens are'
                ' allowed. Received %s.' % (url_fragment))

    def to_dict(self) -> NoteDict:
        """Returns a dict representing this note domain object.

        Returns:
            dict. A dict, mapping all fields of note instance.
        """
        published_on = utils.convert_naive_datetime_to_string(
            self.published_on) if self.published_on else None
        last_updated = utils.convert_naive_datetime_to_string(
            self.last_updated) if self.last_updated else None
        return {
            'id': self.id,
            'author_id': self.author_id,
            'title': self.title,
            'subtitle': self.subtitle,
            'content': self.content,
            'url_fragment': self.url_fragment,
            'published_on': published_on,
            'last_updated': last_updated
        }

    @classmethod
    def from_dict(cls, note_dict: NoteDict) -> 'Note':
        """Returns a note domain object from a dictionary.

        Args:
            note_dict: dict. The dictionary representation of note
                object.

        Returns:
            Note. The corresponding note domain object.
        """
        last_updated = utils.convert_string_to_naive_datetime_object(
            note_dict['last_updated']
        ) if isinstance(note_dict['last_updated'], str) else None
        published_on = utils.convert_string_to_naive_datetime_object(
            note_dict['published_on']
        ) if isinstance(note_dict['published_on'], str) else None
        note = cls(
            note_dict['id'], note_dict['author_id'],
            note_dict['title'], note_dict['subtitle'],
            note_dict['content'], note_dict['url_fragment'],
            last_updated, published_on
        )

        return note

    def update_title(self, new_title: str) -> None:
        """Updates the title of a note object.

        Args:
            new_title: str. The updated title for the note.
        """
        self.require_valid_title(new_title, True)
        self.title = new_title

    def update_subtitle(self, new_subtitle: str) -> None:
        """Updates the subtitle of a note object.

        Args:
            new_subtitle: str. The updated subtitle for the note.
        """
        self.subtitle = new_subtitle

    def update_url_fragment(self, new_url_fragment: str) -> None:
        """Updates the url_fragment of a note object.

        Args:
            new_url_fragment: str. The updated url fragment for the note.
        """
        self.require_valid_url_fragment(new_url_fragment)
        self.url_fragment = new_url_fragment

    def update_content(self, content: str) -> None:
        """Updates the content of the note.

        Args:
            content: str. The new content of the note.
        """
        self.content = html_cleaner.clean(content)

    @classmethod
    def require_valid_note_id(cls, note_id: str) -> None:
        """Checks whether the note is a valid one.

        Args:
            note_id: str. The note id to validate.
        """
        if len(note_id) != constants.NOTE_ID_LENGTH:
            raise utils.ValidationError('Note ID %s is invalid' % note_id)


class NoteSummary:
    """Domain object for Note Summary."""

    def __init__(
        self,
        note_id: str,
        author_id: str,
        title: str,
        subtitle: str,
        summary: str,
        url_fragment: str,
        last_updated: Optional[datetime.datetime] = None,
        published_on: Optional[datetime.datetime] = None,
        deleted: Optional[bool] = False,
    ) -> None:
        """Constructs a Note Summary domain object.

        Args:
            note_id: str. The unique ID of the note.
            author_id: str. The user ID of the author.
            title: str. The title of the note.
            subtitle: str. The subtitle of the note.
            summary: str. The summary content of the note.
            url_fragment: str. The url fragment for the note.
            last_updated: datetime.datetime. Date and time when the note
                was last updated.
            published_on: datetime.datetime. Date and time when the note
                is last published.
            deleted: bool. Whether the note is deleted or not.
        """
        self.id = note_id
        self.author_id = author_id
        self.title = title
        self.subtitle = subtitle
        self.summary = summary
        self.url_fragment = url_fragment
        self.last_updated = last_updated
        self.published_on = published_on
        self.deleted = deleted

    def validate(self, strict: bool = False) -> None:
        """Validates various properties of the note summary object.

        Args:
            strict: bool. Enable strict checks on the note summary when the
                note is published or is going to be published.

        Raises:
            ValidationError. One or more attributes of note are invalid.
        """
        self.require_valid_title(self.title, strict)
        if strict:
            if not isinstance(self.url_fragment, str):
                raise utils.ValidationError(
                    'Expected url fragment to be a string, received: %s.'
                    % self.url_fragment
                )

            self.require_valid_url_fragment(self.url_fragment)

            if not self.summary:
                raise utils.ValidationError('Summary can not be empty')

        if not isinstance(self.summary, str):
            raise utils.ValidationError(
                'Expected summary to be a string, received: %s' % self.summary)

    @classmethod
    def require_valid_url_fragment(cls, url_fragment: str) -> None:
        """Checks whether the url fragment of the note is a valid one.

        Args:
            url_fragment: str. The url fragment to validate.

        Raises:
            ValidationErrors. URL fragment provided is invalid.
        """
        if not isinstance(url_fragment, str):
            raise utils.ValidationError(
                'Note URL Fragment field must be a string. '
                'Received %s.' % (url_fragment)
            )

        if not url_fragment:
            raise utils.ValidationError(
                'Note URL Fragment field should not be empty.')

        if len(url_fragment) > MAX_CHARS_IN_NOTE_URL_FRAGMENT:
            raise utils.ValidationError(
                'Note URL Fragment field should not exceed %d characters.'
                % MAX_CHARS_IN_NOTE_URL_FRAGMENT
            )

        if not re.match(constants.VALID_URL_NOTE_FRAGMENT_REGEX, url_fragment):
            raise utils.ValidationError(
                'Note URL Fragment field contains invalid characters.'
                'Only lowercase words, numbers separated by hyphens are'
                ' allowed. Received %s.' % (url_fragment))

    @classmethod
    def require_valid_title(cls, title: str, strict: bool) -> None:
        """Checks whether the note title is a valid one.

        Args:
            title: str. The title to validate.
            strict: bool. Enable strict checks on the note summary when the
                note is published or is going to be published.

        Raises:
            ValidationErrors. Title provided is invalid.
        """
        if not isinstance(title, str):
            raise utils.ValidationError(
                'Expected title to be a string, received: %s.' % title)

        if len(title) > constants.MAX_CHARS_IN_NOTE_TITLE:
            raise utils.ValidationError(
                'Note title should at most have %d chars, received: %s'
                % (constants.MAX_CHARS_IN_NOTE_TITLE, title))

        if strict:
            if not title:
                raise utils.ValidationError('Title should not be empty')

    def to_dict(self) -> NoteSummaryDict:
        """Returns a dict representing this note summary domain object.

        Returns:
            dict. A dict, mapping all fields of note instance.
        """
        published_on = utils.convert_naive_datetime_to_string(
            self.published_on) if self.published_on else None
        last_updated = utils.convert_naive_datetime_to_string(
            self.last_updated) if self.last_updated else None
        return {
            'id': self.id,
            'author_id': self.author_id,
            'title': self.title,
            'subtitle': self.subtitle,
            'summary': self.summary,
            'url_fragment': self.url_fragment,
            'published_on': published_on,
            'last_updated': last_updated
        }


class NoteRights:
    """Domain object for Note rights."""

    def __init__(
        self,
        note_id: str,
        editor_ids: List[str],
        note_is_published: bool = False
    ) -> None:
        """Constructs a NoteRights domain object.

        Args:
            note_id: str. The id of the note.
            editor_ids: list(str). The id of the users who have been assigned
                as editors for the note.
            note_is_published: bool. Whether the note is published or not.
        """
        self.id = note_id
        self.editor_ids = editor_ids
        self.note_is_published = note_is_published

    def to_dict(self) -> NoteRightsDict:
        """Returns a dict suitable for use by the frontend.

        Returns:
            dict. A dict version of NoteRights suitable for use by the
            frontend.
        """
        return {
            'note_id': self.id,
            'editor_ids': self.editor_ids,
            'note_is_published': self.note_is_published
        }

    def is_editor(self, user_id: Optional[str]) -> bool:
        """Checks whether given user is an editor of the note.

        Args:
            user_id: str or None. ID of the user.

        Returns:
            bool. Whether user is an editor of the note.
        """
        return bool(user_id in self.editor_ids)
