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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either noteress or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Commands for operations on notes, and related models."""

from __future__ import annotations

import datetime
import html
import logging
import re

from core import feconf
from core import utils
from core.constants import constants
from core.domain import html_cleaner
from core.domain import note_domain
from core.domain import role_services
from core.domain import search_services
from core.domain import user_domain
from core.platform import models

from typing import (
    Callable, List, Literal, Optional, Sequence, Tuple,
        TypedDict, overload
)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import note_models

(note_models,) = models.Registry.import_models([models.Names.NOTE])


# The maximum number of iterations allowed for populating the results of a
# search query.
MAX_ITERATIONS = 10

# Name for the note search index.
SEARCH_INDEX_NOTES = search_services.SEARCH_INDEX_NOTES


class NoteChangeDict(TypedDict):
    """Dictionary representing the change_dict for Note domain object."""

    title: str
    subtitle: str
    content: str


def get_note_from_model(
    note_model: note_models.NoteModel
) -> note_domain.Note:
    """Returns a note domain object given a note model loaded
    from the datastore.

    Args:
        note_model: NoteModel. The note model loaded from the
            datastore.

    Returns:
        Note. A note domain object corresponding to the given
        note model.
    """
    return note_domain.Note(
        note_model.id,
        note_model.author_id,
        note_model.title,
        note_model.subtitle,
        note_model.content,
        note_model.url_fragment,
        note_model.last_updated,
        note_model.published_on)


@overload
def get_note_by_id(
    note_id: str
) -> note_domain.Note: ...


@overload
def get_note_by_id(
    note_id: str, *, strict: Literal[True]
) -> note_domain.Note: ...


@overload
def get_note_by_id(
    note_id: str, *, strict: Literal[False]
) -> Optional[note_domain.Note]: ...


def get_note_by_id(
    note_id: str, strict: bool = True
) -> Optional[note_domain.Note]:
    """Returns a domain object representing a note.

    Args:
        note_id: str. ID of the note.
        strict: bool. Fails noisily if the model doesn't exist.

    Returns:
        Note or None. The domain object representing a note with the
        given id, or None if it does not exist.
    """
    note_model = note_models.NoteModel.get(note_id, strict=strict)
    if note_model:
        return get_note_from_model(note_model)
    else:
        return None


def get_note_by_url_fragment(
    url_fragment: str
) -> Optional[note_domain.Note]:
    """Returns a domain object representing a note.

    Args:
        url_fragment: str. The url fragment of the note.

    Returns:
        Note or None. The domain object representing a note with the
        given ID, or None if it does not exist.
    """
    note_model = (
        note_models.NoteModel.get_by_url_fragment(url_fragment))
    if note_model is None:
        return None

    return get_note_from_model(note_model)


def get_note_summary_from_model(
    note_summary_model: note_models.NoteSummaryModel
) -> note_domain.NoteSummary:
    """Returns a note summary domain object given a note summary
    model loaded from the datastore.

    Args:
        note_summary_model: NoteSummaryModel. The note model
            loaded from the datastore.

    Returns:
        NoteSummary. A note summary domain object corresponding to the
        given note summary model.
    """
    return note_domain.NoteSummary(
        note_summary_model.id,
        note_summary_model.author_id,
        note_summary_model.title,
        note_summary_model.subtitle,
        note_summary_model.summary,
        note_summary_model.url_fragment,
        note_summary_model.last_updated,
        note_summary_model.published_on,
        note_summary_model.deleted)


@overload
def get_note_summary_by_id(
    note_id: str
) -> note_domain.NoteSummary: ...


@overload
def get_note_summary_by_id(
    note_id: str, *, strict: Literal[True]
) -> note_domain.NoteSummary: ...


@overload
def get_note_summary_by_id(
    note_id: str, *, strict: Literal[False]
) -> Optional[note_domain.NoteSummary]: ...


def get_note_summary_by_id(
    note_id: str, strict: bool = True
) -> Optional[note_domain.NoteSummary]:
    """Returns a domain object representing a note summary.

    Args:
        note_id: str. ID of the note.
        strict: bool. Fails noisily if the model doesn't exist.

    Returns:
        NoteSummary or None. The domain object representing a note
        summary with the given ID, or None if it does not exist.
    """
    note_summary_model = note_models.NoteSummaryModel.get(
        note_id, strict=strict)
    if note_summary_model:
        note_summary = get_note_summary_from_model(
            note_summary_model)
        return note_summary
    else:
        return None


def get_note_summary_models_by_ids(
    note_ids: List[str]
) -> List[note_domain.NoteSummary]:
    """Given the list of note IDs, it returns the list of note summary
    domain object.

    Args:
        note_ids: List[str]. The list of note IDs for which note
            summaries are to be fetched.

    Returns:
        List[NoteSummary]. The list of note summary domain object
        corresponding to the given list of note IDs.
    """
    note_summary_models = note_models.NoteSummaryModel.get_multi(
        note_ids)
    return [
        get_note_summary_from_model(model)
        for model in note_summary_models if model is not None
    ]


def get_note_summary_models_list_by_user_id(
    user_id: str, note_is_published: bool
) -> List[note_domain.NoteSummary]:
    """Given the user ID and status, it returns the list of note summary
    domain object for which user is an editor and the status matches.

    Args:
        user_id: str. The user who is editor of the notes.
        note_is_published: bool. Whether the given note is
            published or not.

    Returns:
        list(NoteSummary). The note summaries of the notes for
        which the user is an editor corresponding to the status
        (draft/published).
    """
    note_ids = filter_note_ids(user_id, note_is_published)
    note_summary_models = (
        note_models.NoteSummaryModel.get_multi(note_ids))
    note_summaries = []
    note_summaries = [
        get_note_summary_from_model(model)
        for model in note_summary_models if model is not None
    ]
    sort_note_summaries: Callable[[note_domain.NoteSummary], float] = (
        lambda k: k.last_updated.timestamp() if k.last_updated else 0
    )
    return (
        sorted(
            note_summaries,
            key=sort_note_summaries,
            reverse=True
        )
        if len(note_summaries) != 0 else []
    )


def filter_note_ids(
    user_id: str,
    note_is_published: bool
) -> List[str]:
    """Given the user ID and status, it returns the IDs of all note
    according to the status.

    Args:
        user_id: str. The user who is editor of the note.
        note_is_published: bool. True if note is published.

    Returns:
        list(str). The note IDs of the notes for which the user is an
        editor corresponding to the status(draft/published).
    """
    if note_is_published:
        note_rights_models = (
            note_models.NoteRightsModel.get_published_models_by_user(
                user_id))
    else:
        note_rights_models = (
            note_models.NoteRightsModel.get_draft_models_by_user(
                user_id))
    model_ids = []
    if note_rights_models:
        for model in note_rights_models:
            model_ids.append(model.id)
    return model_ids


def get_note_summary_by_title(
    title: str
) -> Optional[note_domain.NoteSummary]:
    """Returns a domain object representing a note post summary model.

    Args:
        title: str. The title of the note post.

    Returns:
        NoteSummary or None. The domain object representing a note post
        summary with the given title, or None if it does not exist.
    """
    note_summary_model: Sequence[note_models.NoteSummaryModel] = (
        note_models.NoteSummaryModel.query(
            note_models.NoteSummaryModel.title == title  # pylint: disable=singleton-comparison
        ).fetch()
    )

    if len(note_summary_model) == 0:
        return None

    return get_note_summary_from_model(note_summary_model[0])


def get_new_note_id() -> str:
    """Returns a new note ID.

    Returns:
        str. A new note ID.
    """
    return note_models.NoteModel.generate_new_note_id()


def get_note_rights_from_model(
    note_rights_model: note_models.NoteRightsModel
) -> note_domain.NoteRights:
    """Returns a note rights domain object given a note rights
    model loaded from the datastore.

    Args:
        note_rights_model: NoteRightsModel. The note rights model
            loaded from the datastore.

    Returns:
        NoteRights. A note rights domain object corresponding to the
        given note rights model.
    """
    return note_domain.NoteRights(
        note_rights_model.id,
        note_rights_model.editor_ids,
        note_rights_model.note_is_published)


@overload
def get_note_rights(
    note_id: str
) -> note_domain.NoteRights: ...


@overload
def get_note_rights(
    note_id: str, *, strict: Literal[True]
) -> note_domain.NoteRights: ...


@overload
def get_note_rights(
    note_id: str, *, strict: Literal[False]
) -> Optional[note_domain.NoteRights]: ...


def get_note_rights(
    note_id: str, strict: bool = True
) -> Optional[note_domain.NoteRights]:
    """Retrieves the rights object for the given note.

    Args:
        note_id: str. ID of the note.
        strict: bool. Whether to fail noisily if no note rights model
            with a given ID exists in the datastore.

    Returns:
        NoteRights. The rights object associated with the given note.

    Raises:
        EntityNotFoundError. The note with ID note id was not
            found in the datastore.
    """

    model = note_models.NoteRightsModel.get(note_id, strict=strict)

    if model is None:
        return None

    return get_note_rights_from_model(model)


def get_published_note_summaries_by_user_id(
    user_id: str, max_limit: int, offset: int=0
) -> List[note_domain.NoteSummary]:
    """Retrieves the summary objects for given number of published notes
    for which the given user is an editor.

    Args:
        user_id: str. ID of the user.
        max_limit: int. The number of models to be fetched.
        offset: int. Number of query results to skip from top.

    Returns:
        list(NoteSummary). The summary objects associated with the
        notes assigned to given user.
    """
    # All the notes which are not published and are saved as 'draft' will
    # have 'published_on' field as 'None'. We use '!= None' to fetch the
    # published notes instead of 'is not None' because it is inside
    # query() and Google App Engine does not support 'is not None' inside
    # query().
    note_summary_models: Sequence[note_models.NoteSummaryModel] = (
        note_models.NoteSummaryModel.query(
            note_models.NoteSummaryModel.author_id == user_id
        ).filter(
            note_models.NoteSummaryModel.published_on != None  # pylint: disable=singleton-comparison, inequality-with-none, line-too-long
        ).order(
            -note_models.NoteSummaryModel.published_on
        ).fetch(
            max_limit, offset=offset
        )
    )
    if len(note_summary_models) == 0:
        return []
    note_summaries = [
        get_note_summary_from_model(model)
        for model in note_summary_models if model is not None
    ]
    return note_summaries


def does_note_with_url_fragment_exist(url_fragment: str) -> bool:
    """Checks if note with provided url fragment exists.

    Args:
        url_fragment: str. The url fragment for the note.

    Returns:
        bool. Whether the url fragment for the note exists.

    Raises:
        Exception. Note URL fragment is not a string.
    """
    if not isinstance(url_fragment, str):
        raise utils.ValidationError(
            'Note URL fragment should be a string. Recieved:'
            '%s' % url_fragment)
    existing_note = get_note_by_url_fragment(url_fragment)
    return existing_note is not None


def _save_note(note: note_domain.Note) -> None:
    """Saves a Note domain object to the datastore.

    Args:
        note: Note. The note domain object for the given
            note.
    """
    model = note_models.NoteModel.get(note.id, strict=True)
    note.validate()

    model.title = note.title
    model.subtitle = note.subtitle
    model.content = note.content
    model.published_on = note.published_on
    model.url_fragment = note.url_fragment
    model.update_timestamps()
    model.put()


def publish_note(note_id: str) -> None:
    """Marks the given note as published.

    Args:
        note_id: str. The ID of the given note.

    Raises:
        Exception. The given note does not exist.
    """
    note_rights = get_note_rights(note_id, strict=False)
    if note_rights is None:
        raise Exception('The given note does not exist')
    note = get_note_by_id(note_id, strict=True)
    note.validate(strict=True)
    note_summary = get_note_summary_by_id(note_id, strict=True)
    note_summary.validate(strict=True)

    if not note_rights.note_is_published:
        note_rights.note_is_published = True
        published_on = datetime.datetime.utcnow()
        note.published_on = published_on
        note_summary.published_on = published_on

    save_note_rights(note_rights)
    _save_note_summary(note_summary)
    _save_note(note)

    index_note_summaries_given_ids([note_id])


def unpublish_note(note_id: str) -> None:
    """Marks the given note as unpublished or draft.

    Args:
        note_id: str. The ID of the given note.

    Raises:
        Exception. The given note does not exist.
    """
    note_rights = get_note_rights(note_id, strict=False)
    if note_rights is None:
        raise Exception('The given note does not exist')

    note = get_note_by_id(note_id, strict=True)
    note.published_on = None
    _save_note(note)

    note_summary = get_note_summary_by_id(note_id, strict=True)
    note_summary.published_on = None
    _save_note_summary(note_summary)

    note_rights.note_is_published = False
    save_note_rights(note_rights)

    search_services.delete_note_summary_from_search_index(
      note_id)


def delete_note(note_id: str) -> None:
    """Deletes all the models related to a note.

    Args:
        note_id: str. ID of the note which is to be
            deleted.
    """
    note_models.NoteModel.get(note_id).delete()
    note_models.NoteSummaryModel.get(note_id).delete()
    note_models.NoteRightsModel.get(note_id).delete()

    search_services.delete_note_summary_from_search_index(
        note_id)


def _save_note_summary(
    note_summary: note_domain.NoteSummary
) -> None:
    """Saves a NoteSummary domain object to the datastore.

    Args:
        note_summary: NoteSummary. The summary object for the given
            note summary.
    """
    model = note_models.NoteSummaryModel.get(
        note_summary.id, strict=False)
    if model:
        model.author_id = note_summary.author_id
        model.title = note_summary.title
        model.subtitle = note_summary.subtitle
        model.summary = note_summary.summary
        model.published_on = note_summary.published_on
        model.url_fragment = note_summary.url_fragment
    else:
        model = note_models.NoteSummaryModel(
            id=note_summary.id,
            author_id=note_summary.author_id,
            title=note_summary.title,
            subtitle=note_summary.subtitle,
            summary=note_summary.summary,
            published_on=note_summary.published_on,
            url_fragment=note_summary.url_fragment,
        )
    model.update_timestamps()
    model.put()


def save_note_rights(note_rights: note_domain.NoteRights) -> None:
    """Saves a NoteRights domain object to the datastore.

    Args:
        note_rights: NoteRights. The rights object for the given
            note.
    """
    model = note_models.NoteRightsModel.get(
        note_rights.id, strict=True)

    model.editor_ids = note_rights.editor_ids
    model.note_is_published = note_rights.note_is_published
    model.update_timestamps()
    model.put()


def check_can_edit_note(
    user: user_domain.UserActionsInfo,
    note_rights: Optional[note_domain.NoteRights]
) -> bool:
    """Checks whether the user can edit the given note.

    Args:
        user: UserActionsInfo. Object having user_id, role and actions for
            given user.
        note_rights: NoteRights or None. Rights object for the given
            note.

    Returns:
        bool. Whether the given user can edit the given note.
    """
    if note_rights is None:
        return False
    if role_services.ACTION_EDIT_ANY_NOTE in user.actions:
        return True
    if note_rights.is_editor(user.user_id):
        return True

    return False


def generate_url_fragment(title: str, note_id: str) -> str:
    """Generates the url fragment for a note from the title of the note.

    Args:
        title: str. The title of the note.
        note_id: str. The unique note ID.

    Returns:
        str. The url fragment of the note.
    """
    lower_title = title.lower()
    # Removing special characters from url fragment.
    simple_title = re.sub(r'[^a-zA-Z0-9 ]', '', lower_title)
    hyphenated_title = re.sub(r'[\s-]+', '-', simple_title)
    lower_id = note_id.lower()
    return hyphenated_title + '-' + lower_id


def generate_summary_of_note(content: str) -> str:
    """Generates the summary for a note from the content of the note.

    Args:
        content: santized html str. The note content to be truncated.

    Returns:
        str. The summary of the note.
    """
    # Stripping away headings and content within bold tags.
    raw_html = re.sub(
        '<strong>?(.*?)</strong>',
        '',
        re.sub('<h1>?(.*?)</h1>', '', content, flags=re.DOTALL),
        flags=re.DOTALL
    )
    raw_text = html_cleaner.strip_html_tags(raw_html)
    max_chars_in_summary = constants.MAX_CHARS_IN_NOTE_SUMMARY - 3
    if len(raw_text) > max_chars_in_summary:
        summary = html.unescape(raw_text)[:max_chars_in_summary] + '...'
        return summary.strip()
    return html.unescape(raw_text)


def compute_summary_of_note(
    note: note_domain.Note
) -> note_domain.NoteSummary:
    """Creates NoteSummary domain object from Note domain object.

    Args:
        note: Note. The note domain object.

    Returns:
        NoteSummary. The note summary domain object.
    """
    summary = generate_summary_of_note(note.content)

    return note_domain.NoteSummary(
        note.id,
        note.author_id,
        note.title,
        note.subtitle,
        summary,
        note.url_fragment,
        note.last_updated,
        note.published_on)


def apply_change_dict(
    note_id: str, change_dict: NoteChangeDict
) -> note_domain.Note:
    """Applies a changelist to note and returns the result.

    Args:
        note_id: str. ID of the given note.
        change_dict: dict. A dict containing all the changes keyed
            by corresponding field name (title, subtitle and content).

    Returns:
        UpdatedNote. The modified note object.
    """
    note = get_note_by_id(note_id, strict=True)

    if 'title' in change_dict:
        note.update_title(change_dict['title'].strip())
        url_fragment = generate_url_fragment(
            change_dict['title'].strip(), note_id)
        note.update_url_fragment(url_fragment)
    if 'content' in change_dict:
        note.update_content(change_dict['content'])

    return note


def update_note(
    note_id: str, change_dict: NoteChangeDict
) -> None:
    """Updates the note and its summary model in the datastore.

    Args:
        note_id: str. The ID of the note which is to be updated.
        change_dict: dict. A dict containing all the changes keyed by
            corresponding field name (title, subtitle and content).
    """
    updated_note = apply_change_dict(note_id, change_dict)
    _save_note(updated_note)
    updated_note_summary = compute_summary_of_note(updated_note)
    _save_note_summary(updated_note_summary)


def create_new_note(author_id: str) -> note_domain.Note:
    """Creates models for new note and returns new Note domain
    object.

    Args:
        author_id: str. The user ID of the author for new note.

    Returns:
        Note. A newly created note domain object .
    """
    note_id = get_new_note_id()
    new_note_model = note_models.NoteModel.create(
        note_id, author_id
    )
    note_models.NoteRightsModel.create(note_id, author_id)
    new_note = get_note_from_model(new_note_model)
    new_note_summary_model = compute_summary_of_note(new_note)
    _save_note_summary(new_note_summary_model)

    return new_note


def get_published_note_summaries(
    offset: int=0, size: Optional[int]=None
) -> List[note_domain.NoteSummary]:
    """Returns published NoteSummaries list.

    Args:
        offset: int. Number of query results to skip from top.
        size: int or None. Number of note summaries to return if there are
            at least that many, otherwise it contains all remaining results.
            If None, maximum number of note summaries to display on note
            homepage will be returned if there are at least that many.

    Returns:
        list(NoteSummaries). These are sorted in order of the
        date published.
    """
    if size:
        max_limit = size
    else:

        max_limit = 10
    # We use '!= None' instead of 'is not None' because the it is inside
    # query() and Google App Engine does not support 'is not None' inside
    # query().
    note_summary_models: Sequence[note_models.NoteSummaryModel] = (
        note_models.NoteSummaryModel.query(
            note_models.NoteSummaryModel.published_on != None  # pylint: disable=singleton-comparison, inequality-with-none, line-too-long
        ).order(
            -note_models.NoteSummaryModel.published_on
        ).fetch(
            max_limit, offset=offset
        )
    )
    if len(note_summary_models) == 0:
        return []
    note_summaries = []
    note_summaries = [
        get_note_summary_from_model(model)
        for model in note_summary_models if model is not None
    ]
    return note_summaries


def get_total_number_of_published_note_summaries() -> int:
    """Returns total number of published NoteSummaries.

    Returns:
        int. Total number of published NoteSummaries.
    """
    return note_models.NoteRightsModel.query(
        note_models.NoteRightsModel.note_is_published == True  # pylint: disable=singleton-comparison
    ).count()


def get_total_number_of_draft_note_summaries() -> int:
    """Returns total number of draft NoteSummaries.

    Returns:
        int. Total number of draft NoteSummaries.
    """
    return note_models.NoteRightsModel.query(
        note_models.NoteRightsModel.note_is_published == False  # pylint: disable=singleton-comparison
    ).count()


def get_total_number_of_published_note_summaries_by_author(
    author_id: str
) -> int:
    """Returns total number of published NoteSummaries by author.

    Returns:
        int. Total number of published NoteSummaries by author.
    """
    return len(note_models.NoteRightsModel.get_published_models_by_user(
        author_id))


def get_total_number_of_draft_note_summaries_by_author(
    author_id: str
) -> int:
    """Returns total number of draft NoteSummaries by author.

    Returns:
        int. Total number of draft NoteSummaries by author.
    """
    return len(note_models.NoteRightsModel.get_draft_models_by_user(
        author_id))


def update_note_models_author_and_published_on_date(
    note_id: str,
    author_id: str,
    date: str
) -> None:
    """Updates note model with the author id and published on
    date provided.

    Args:
        note_id: str. The ID of the note which has to be updated.
        author_id: str. User ID of the author.
        date: str. The date of publishing the note.
    """
    note = get_note_by_id(note_id, strict=True)
    note_rights = get_note_rights(note_id, strict=True)

    note.author_id = author_id
    supported_date_string = date + ', 00:00:00:00'
    note.published_on = utils.convert_string_to_naive_datetime_object(
        supported_date_string)
    note.validate(strict=True)

    note_summary = compute_summary_of_note(note)
    _save_note_summary(note_summary)

    note_model = note_models.NoteModel.get(
        note.id, strict=True)
    note_model.author_id = note.author_id
    note_model.published_on = note.published_on
    note_model.update_timestamps()
    note_model.put()

    note_rights.editor_ids.append(note.author_id)
    save_note_rights(note_rights)


def index_note_summaries_given_ids(note_ids: List[str]) -> None:
    """Indexes the note summaries corresponding to the given note ids.

    Args:
        note_ids: list(str). List of ids of the note summaries to be
            indexed.
    """
    note_summaries = get_note_summary_models_by_ids(note_ids)
    if len(note_summaries) > 0:
        search_services.index_note_summaries([
            note_summary for note_summary in note_summaries
            if note_summary is not None
        ])


def does_note_with_title_exist(title: str, note_id: str) -> bool:
    """Checks whether a note with given title already exists.

    Args:
        title: str. The title of the note.
        note_id: str. The id of the note.

    Returns:
        bool. Whether a note with given title already exists.
    """
    note_post_models: Sequence[note_models.NoteModel] = (
        note_models.NoteModel.get_all().filter(
            note_models.NoteModel.title == title
        ).fetch()
    )
    if len(note_post_models) > 0:
        if (
            len(note_post_models) > 1 or
            note_post_models[0].id != note_id
        ):
            return True
    return False


def get_note_ids_matching_query(
        query_string: str, size: int, offset: Optional[int]=None
) -> Tuple[List[str], Optional[int]]:
    """Returns a list with all note ids matching the given search query
    string, as well as a search offset for future fetches.

    Args:
        query_string: str. A search query string.
        size: int. The maximum number of note summary domain objects to
            be returned if there are at least that many, otherwise it contains
            all results.
        offset: int or None. Optional offset from which to start the search
            query. If no offset is supplied, the first N results matching
            the query are returned.

    Returns:
        2-tuple of (valid_note_ids, search_offset). Where:
            valid_note_ids : list(str). A list with all note ids
                matching the given search query string, as well
                as a search offset for future fetches.
                The list contains exactly 'size' number of results if there are
                at least that many, otherwise it contains all remaining results.
                (If this behaviour does not occur, an error will be logged.)
            search_offset: int. Search offset for future fetches.
    """
    valid_note_ids: List[str] = []
    search_offset: Optional[int] = offset

    for _ in range(MAX_ITERATIONS):
        remaining_to_fetch = size - len(valid_note_ids)

        note_ids, search_offset = (
            search_services.search_note_summaries(
                query_string,
                remaining_to_fetch,
                offset=search_offset
            )
        )

        invalid_note_ids = []
        for ind, model in enumerate(
                note_models.NoteSummaryModel.get_multi(note_ids)):
            if model is not None:
                valid_note_ids.append(note_ids[ind])
            else:
                invalid_note_ids.append(note_ids[ind])

        if (
            (
                len(valid_note_ids) ==
                feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE
            ) or search_offset is None
        ):
            break

        if len(invalid_note_ids) > 0:
            logging.error(
                'Search index contains stale note ids: %s' %
                ', '.join(invalid_note_ids))

    if (
        (
            len(valid_note_ids) <
            feconf.MAX_NUM_CARDS_TO_DISPLAY_ON_NOTE_HOMEPAGE
        ) and search_offset is not None
    ):
        logging.error(
            'Could not fulfill search request for query string %s; at least'
            '%s retries were needed.' % (query_string, MAX_ITERATIONS))
    return (valid_note_ids, search_offset)
