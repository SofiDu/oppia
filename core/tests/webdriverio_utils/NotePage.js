// Copyright 2022 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Page object for the note page, for use in WebdriverIO
 * tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');
var general = require('./general.js');
var NotePage = require('./NotePage.js');
var forms = require('../webdriverio_utils/forms.js');

var NotePage = function () {
  var notesPage = new NotePage.NotesPage();
  var noResultsFoundContainer = $('.e2e-test-no-results-found');
  var noteHomepageWelcomeHeading = $('.e2e-test-note-welcome-heading');
  var oppiaAvatarImage = $('.e2e-test-oppia-avatar-image');
  var oppiaNotePageContainer = $('.e2e-test-oppia-note-page-card');
  var noteTitleContainer = $('.e2e-test-note-page-title-container');
  var noteSearchField = $('.e2e-test-search-field');
  var notesList = $('.e2e-test-note-list');
  var navigateToNoteHomePageButton = $('.e2e-test-back-button');
  var paginationNextButton = $('.e2e-test-pagination-next-button');
  var paginationPrevButton = $('.e2e-test-pagination-prev-button');
  var paginationContainer = $('.e2e-test-pagination');
  var searchInput = $('.e2e-test-search-input');
  var noteTilesSelector = function () {
    return $$('.e2e-test-note-tile-item');
  };

  this.submitSearchQuery = async function (searchQuery) {
    await action.clear('Search input', searchInput);
    await action.setValue('Search input', searchInput, searchQuery);
  };

  this.get = async function () {
    await browser.url(general.NOTE_PAGE_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.getNoteSearchPage = async function (searchQuery) {
    await browser.url(
      general.NOTE_PAGE_SEARCH_URL_PREFIX + '?q=' + searchQuery
    );
    await waitFor.pageToFullyLoad();
  };

  this.expectNoResultsFoundShown = async function () {
    await this.waitForVisibilityOfNoteHomePageContainer();
    await waitFor.visibilityOf(
      noResultsFoundContainer,
      'No results found container taking too long to display'
    );
  };

  this.expectNoteHomePageWelcomeHeadingToBeVisible = async function () {
    await waitFor.visibilityOf(
      noteHomepageWelcomeHeading,
      'Note Home Page Heading taking too long to display'
    );
  };

  this.expectOppiaAvatarImageToBeVisible = async function () {
    await waitFor.visibilityOf(
      oppiaAvatarImage,
      'Oppia Avatar image taking too long to display'
    );
  };

  this.publishNewNoteFromNotesPage = async function (
    noteTitle,
    richTextContent,
    tagsList
  ) {
    await notesPage.createNewNote();
    await notesPage.publishNewNote(
      noteTitle,
      await forms.toRichText(richTextContent),
      tagsList
    );
    await notesPage.navigateToNotePageWithBackButton();
  };

  this.saveNoteAsDraftFromNotesPage = async function (
    noteTitle,
    richTextContent
  ) {
    await notesPage.createNewNote();
    await notesPage.saveNoteAsDraft(
      noteTitle,
      await forms.toRichText(richTextContent)
    );
    await notesPage.navigateToNotePageWithBackButton();
  };

  this.expectNoteSearchFieldToBeVisible = async function () {
    await waitFor.visibilityOf(
      noteSearchField,
      'Search Field taking too long to display'
    );
  };

  this.expectNumberOfNotesToBe = async function (number) {
    await this.waitForVisibilityOfNoteHomePageContainer();
    await this.waitForNotesToLoad();
    var noteTiles = await noteTilesSelector();
    expect(noteTiles.length).toBe(number);
  };

  this.waitForVisibilityOfNoteHomePageContainer = async function () {
    await waitFor.visibilityOf(
      oppiaNoteHomePageCardContainer,
      'Oppia Note Home Page taking too long to display'
    );
  };

  this.waitForNotesToLoad = async function () {
    await waitFor.visibilityOf(
      notesList,
      'Note posts list taking too long to appear.'
    );
  };

  this.navigateToNotePage = async function (title) {
    await this.waitForNotesToLoad();
    var noteTiles = await noteTilesSelector();
    for (i = 0; i < noteTiles.length; i++) {
      var noteTile = noteTiles[i];
      var noteTitleContainer = await noteTile.$('.e2e-test-note-tile-title');
      // The element is not interactable when we call getText(), so it returns
      // null. To avoid that we are waiting till the element becomes clicakble
      // as we do not have any alternative for checking interactibility.
      await waitFor.elementToBeClickable(
        noteTitleContainer,
        'Note Post title is not interactable'
      );
      var noteTitle = await action.getText(
        `Note Post Tile Title ${i}`,
        noteTitleContainer
      );
      if (noteTitle === title) {
        await action.click('note post tile', noteTile);
        await waitFor.pageToFullyLoad();
        break;
      }
    }
  };

  this.expectNotePageTitleToBe = async function (title) {
    await waitFor.visibilityOf(
      oppiaNotePageContainer,
      'Oppia Note Post Page taking too long to display'
    );
    await waitFor.visibilityOf(
      noteTitleContainer,
      'Oppia Note Post Page taking too long to display'
    );
    var noteTitle = await action.getText('Note Post Title', noteTitleContainer);
    expect(noteTitle).toEqual(title);
  };

  this.navigateToNoteHomePageWithBackButton = async function () {
    await action.click(
      'button to navigate back to note home page',
      navigateToNoteHomePageButton
    );
    await waitFor.pageToFullyLoad();
    await this.waitForVisibilityOfNoteHomePageContainer();
  };

  this.moveToNextPage = async function () {
    await waitFor.visibilityOf(
      paginationContainer,
      'Pagination taking to long to display.'
    );
    await action.click('pagination next button', paginationNextButton);
  };

  this.moveToPrevPage = async function () {
    await waitFor.visibilityOf(
      paginationContainer,
      'Pagination taking to long to display.'
    );
    await action.click('pagination prev button', paginationPrevButton);
  };
};

exports.NotePage = NotePage;
