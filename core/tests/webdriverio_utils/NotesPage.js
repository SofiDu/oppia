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
 * @fileoverview Page object for the note page, for use
 * in Webdriverio tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');
var forms = require('../webdriverio_utils/forms.js');
var general = require('../webdriverio_utils/general.js');

var NotePage = function () {
  var createNoteButton = $('.e2e-test-create-note-button');
  var editNoteButton = $('.e2e-test-edit-note-button');
  var unpublishNoteButton = $('.e2e-test-unpublish-note-button');
  var deleteNoteButton = $('.e2e-test-delete-note-button');
  var matTabLabel = $('.mat-tab-label');
  var matTabLabelsSelector = function () {
    return $$('.mat-tab-label');
  };
  var noteContentEditor = $('.e2e-test-content-editor');
  var noteTitleFieldElement = $('.e2e-test-note-title-field');
  var listViewButton = $('.e2e-test-list-view-button');
  var tilesViewButton = $('.e2e-test-tiles-view-button');
  var draftNotesTable = $('.e2e-test-drafts-note-table');
  var publishedNotesTable = $('.e2e-test-published-note-table');
  var noteListItem = $('.e2e-test-note-list-item');
  var noteListItemsSelector = function () {
    return $$('.e2e-test-note-list-item');
  };
  var draftNoteTilesSelector = function () {
    return $$('.e2e-test-draft-note-tile-item');
  };
  var publishedNoteTilesSelector = function () {
    return $$('.e2e-test-published-note-tile-item');
  };
  var saveNoteAsDraftButton = $('.e2e-test-save-as-draft-button');
  var publishNoteButton = $('.e2e-test-publish-note-button');
  var saveNoteContentButton = $('.e2e-test-save-note-content');
  var noteContentDisplay = $('.e2e-test-content-display');
  var confirmButton = $('.e2e-test-confirm-button');
  var notesPageIntroMessageContainer = $('.e2e-test-intro-message-container');
  var notesPageLink = $('.e2e-test-notes-page-link');
  var noteTileElement = $('.e2e-test-notes-page-tile');
  var noteTilesSelector = function () {
    return $$('.e2e-test-notes-page-tile');
  };
  var matInkBar = $('.mat-ink-bar');
  var navigateToNoteButton = $('.e2e-test-back-button');

  this.get = async function () {
    await waitFor.pageToFullyLoad();
    await general.openProfileDropdown();
    await action.click('Notes page link from dropdown', notesPageLink);
    await waitFor.pageToFullyLoad();
    await waitFor.urlRedirection('http://localhost:8181/notes-page');
  };

  this.navigateToNotePageWithBackButton = async function () {
    await action.click(
      'Navigate back to notes page button',
      navigateToNoteButton
    );
    await waitFor.pageToFullyLoad();
  };

  this.waitForDraftNotesToLoad = async function () {
    await waitFor.visibilityOf(
      draftNotesTable,
      'Note posts table taking too long to appear.'
    );
  };

  this.waitForPublishedNotesToLoad = async function () {
    await waitFor.visibilityOf(
      publishedNotesTable,
      'Notes table taking too long to appear.'
    );
  };

  this.createNewNote = async function () {
    await action.click('Create Note button', createNoteButton);

    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      noteTitleFieldElement,
      'Note Editor is taking too long to appear.'
    );
    await waitFor.pageToFullyLoad();
  };

  this.setContent = async function (richTextInstructions) {
    var schemaBasedEditorTag = await noteContentEditor.$(
      '<schema-based-editor>'
    );
    await waitFor.visibilityOf(
      schemaBasedEditorTag,
      'Schema based editor tag not showing up'
    );
    var richTextEditor = await forms.RichTextEditor(schemaBasedEditorTag);
    await richTextEditor.clear();
    await richTextInstructions(richTextEditor);
    await action.click('Save Content Button', saveNoteContentButton);
    await waitFor.invisibilityOf(
      saveNoteContentButton,
      'Content editor takes too long to disappear'
    );
  };

  this.saveNoteAsDraft = async function (noteTitle, richTextInstructions) {
    await action.setValue(
      'New note title field',
      noteTitleFieldElement,
      noteTitle
    );
    await this.setContent(richTextInstructions);
    await waitFor.visibilityOf(
      noteContentDisplay,
      'Note content not showing up'
    );
    await action.click('Save as draft Button', saveNoteAsDraftButton);
    await waitFor.visibilityOfSuccessToast('Note Saved Successfully.');
    await waitFor.invisibilityOfSuccessToast('Note Saved Successfully.');
  };

  this.publishNewNote = async function (noteTitle, richTextInstructions) {
    await action.setValue(
      'New note title field',
      noteTitleFieldElement,
      noteTitle
    );
    await this.setContent(richTextInstructions);
    await waitFor.presenceOf(noteContentDisplay, 'Note content not showing up');
    await action.click('Publish Note Button', publishNoteButton);
    await action.click('Confirm Publish Note button', confirmButton);
    await waitFor.visibilityOfSuccessToast(
      'Note Saved and Published Succesfully.'
    );
    await waitFor.invisibilityOfSuccessToast(
      'Note Saved and Published Succesfully.'
    );
  };

  this.publishDraftNote = async function () {
    await action.click('Publish Note Button', publishNoteButton);
    await action.click('Confirm Publish Note button', confirmButton);
    await waitFor.visibilityOfSuccessToast(
      'Note Saved and Published Succesfully.'
    );
    await waitFor.invisibilityOfSuccessToast(
      'Note Saved and Published Succesfully.'
    );
  };

  this.getMatTab = async function (tabName) {
    await waitFor.visibilityOf(
      matTabLabel,
      'Mat Tab Toggle options take too long to appear.'
    );
    var matTabLabels = await matTabLabelsSelector();
    for (i = 0; i < matTabLabels.length; i++) {
      var matTab = matTabLabels[i];
      var tabText = await action.getText(`Notes page tab ${i}`, matTab);
      if (tabText.startsWith(tabName)) {
        await action.click(`${tabName} tab`, matTab);
        await waitFor.visibilityOf(
          matInkBar,
          'Mat Ink Bar takes too long to appear'
        );
        await waitFor.rightTransistionToComplete(
          matInkBar,
          `${tabName} tab transition takes too long to complete`
        );
        break;
      }
    }
  };

  this.navigateToPublishTab = async function () {
    await waitFor.pageToFullyLoad();
    await this.getMatTab('PUBLISHED');
  };

  this.navigateToDraftsTab = async function () {
    await waitFor.pageToFullyLoad();
    await this.getMatTab('DRAFTS');
  };

  this.expectNumberOfDraftNotesToBe = async function (number) {
    await this.waitForDraftNotesToLoad();
    var draftNoteTiles = await draftNoteTilesSelector();
    expect(draftNoteTiles.length).toBe(number);
  };

  this.notesPageIntroMessageIsVisible = async function () {
    await waitFor.visibilityOf(
      notesPageIntroMessageContainer,
      'Notes page Intro message ' + 'taking too long to be visible'
    );
  };

  this.expectNumberOfPublishedNotesToBe = async function (number) {
    await this.waitForPublishedNotesToLoad();
    var publishedNoteTiles = await publishedNoteTilesSelector();
    expect(publishedNoteTiles.length).toBe(number);
  };

  this.expectNumberOfNotesRowsToBe = async function (number) {
    await this.waitForDraftNotesToLoad();
    var noteListItems = await noteListItemsSelector();
    expect(noteListItems.length).toBe(number);
  };

  this.getNoteTileEditOption = async function (title) {
    await waitFor.visibilityOf(
      noteTileElement,
      'Note tiles take too long to be visible.'
    );
    var noteTiles = await noteTilesSelector();
    for (i = 0; i < noteTiles.length; i++) {
      var noteTile = noteTiles[i];
      var noteTitleContainer = await noteTile.$('.e2e-test-note-title');
      // The element is not interactable when we call getText(), so it returns
      // null. To avoid that we are waiting till the element becomes clickable
      // as we do not have any alternative for checking interactibility.
      await waitFor.elementToBeClickable(
        noteTitleContainer,
        'Note title is not interactable'
      );
      var noteTitle = await action.getText(
        `Note Tile Title ${i}`,
        noteTitleContainer
      );
      if (noteTitle === title) {
        var noteEditOptionButton = await noteTile.$('.e2e-test-note-edit-box');
        return noteEditOptionButton;
      }
    }
  };

  this.deleteNoteWithTitle = async function (title) {
    var noteEditOptionButton = await this.getNoteTileEditOption(title);
    await action.click('Note edit option', noteEditOptionButton);
    await action.click('Delete note button', deleteNoteButton);
    await action.click('Confirm Delete Note button', confirmButton);
    await waitFor.visibilityOfSuccessToast('Note Deleted Successfully.');
    await waitFor.pageToFullyLoad();
  };

  this.navigateToNoteEditorWithTitleFromList = async function (title) {
    await waitFor.visibilityOf(
      noteListItem,
      'Note list take too long to be visible.'
    );
    var noteListItems = await noteListItemsSelector();
    for (i = 0; i < noteListItems.length; i++) {
      var noteRow = noteListItems[i];
      var noteTitleContainer = await noteRow.$('.e2e-test-note-title');
      // The element is not interactable when we call getText(), so it returns
      // null. To avoid that we are waiting till the element becomes clicakble
      // as we do not have any alternative for checking interactibility.
      await waitFor.elementToBeClickable(
        noteTitleContainer,
        'Note title is not interactable'
      );
      var noteTitle = await action.getText(
        `Note Tile Title ${i}`,
        noteTitleContainer
      );
      if (noteTitle === title) {
        await action.click('note row', noteRow);
        await waitFor.pageToFullyLoad();
        break;
      }
    }
  };

  this.deleteNoteFromEditor = async function () {
    await action.click('Delete note button', deleteNoteButton);
    await action.click('Confirm Delete Note button', confirmButton);
    await waitFor.visibilityOfSuccessToast('Note Deleted Successfully.');
    await waitFor.pageToFullyLoad();
  };

  this.unpublishNoteWithTitle = async function (title) {
    var noteEditOptionButton = await this.getNoteTileEditOption(title);
    await action.click('Note edit option', noteEditOptionButton);
    await action.click('Unpublish note button', unpublishNoteButton);
    await action.click('Confirm unpublishing Note button', confirmButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToNoteEditorWithTitle = async function (title) {
    var noteEditOptionButton = await this.getNoteTileEditOption(title);
    await action.click('Note edit option', noteEditOptionButton);
    await action.click('Edit note button', editNoteButton);
    await waitFor.pageToFullyLoad();
  };

  this.getListView = async function () {
    await action.click('List View Button', listViewButton);
  };

  this.getTilesView = async function () {
    await action.click('Tiles View Button', tilesViewButton);
  };
};

exports.NotePage = NotePage;
