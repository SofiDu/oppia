// Copyright 2022 The Oppia Authors. All Rights Reserved.
// //
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// //
//      http://www.apache.org/licenses/LICENSE-2.0
// //
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview End-to-end tests for the note pages.
 */

var users = require('../webdriverio_utils/users.js');

var NotePage = require('../webdriverio_utils/NotePage.js');
var NotesPage = require('../webdriverio_utils/NotesPage.js');

describe('Note Pages functionality', function () {
  var notePages = null;
  var notesPage = null;

  beforeAll(async function () {
    notePages = new NotePage.NotePage();
    notesPage = new NotesPage.NotesPage();
    await users.createUserWithRole('note@notes.com', 'note', 'note admin');
    await users.createUserWithRole(
      'secondNote@notes.com',
      'secondUser',
      'note admin'
    );
    await users.login('secondNote@notes.com');
  });

  it(
    'should checks welcome message is visible on homepage, with' +
      ' no results found page as no note is published',
    async function () {
      await notePages.get();
      await notePages.expectNoResultsFoundShown();
      await notePages.expectNoteHomePageWelcomeHeadingToBeVisible();
      await notePages.expectOppiaAvatarImageToBeVisible();
      await notePages.expectNotePostSearchFieldToBeVisible();
    }
  );

  it(
    'should only show published note on note page, navigate to note ' +
      'post page and show no recommendations',
    async function () {
      await notesPage.get();
      await notesPage.updateAuthorDetails('secondUser', 'Oppia Note Author');

      await notePages.saveNotePostAsDraftFromNotesPage(
        'Draft note Title',
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'
      );
      await notesPage.expectNumberOfDraftNotePostsToBe(1);

      await notePages.publishNewNotePostFromNotesPage(
        'Published Note Post Title',
        'Hi there, I’m Oppia! I’m an online personal tutor for everybody!',
        ['News', 'International', 'Educators']
      );
      await notesPage.navigateToPublishTab();
      await notesPage.expectNumberOfPublishedNotePostsToBe(1);

      await notePages.get();
      await notePages.expectNumberOfNotePostsToBe(1);
      await notePages.navigateToNotePostPage('Published Note Post Title');
      await notePages.expectNotePostPageTitleToBe('Published Note Post Title');
      await notePages.navigateToNoteHomePageWithBackButton();
      await users.logout();

      // Logging in for user with username 'note'.
      await users.login('note@notes.com');
      await notePages.get();
      await notePages.expectNumberOfNotePostsToBe(1);
      await notePages.navigateToNotePostPage('Published Note Post Title');
      await notePages.expectNoteAuthorDetailsToBeVisible('secondUser');
    }
  );

  it('should show published notes on note page and use pagination,', async function () {
    // Publishing 7 notes by user with username 'note'.
    await notesPage.get();
    await notesPage.updateAuthorDetails(
      'note',
      'Oppia Note Author with name note'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Note post Title Two',
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!' +
        'Second Note Post Content.'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Note Three',
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!' +
        'Third Note Post Content.'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Post Title Four',
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Note post Title Five',
      'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Sixth Note',
      'I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Seventh Notegers Post',
      'I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Eight Article by note author',
      'I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notesPage.navigateToPublishTab();
    await notesPage.expectNumberOfPublishedNotePostsToBe(7);

    // Checking for notes on note homepage.
    await notePages.get();
    await notePages.expectNumberOfNotePostsToBe(8);
    await users.logout();

    // Logging in with different username - 'secondUser' and publishing a
    // few more notes.
    await users.login('secondNote@notes.com');
    await notesPage.get();
    await notePages.publishNewNotePostFromNotesPage(
      'Article number Nine',
      'I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Tenth note',
      'I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notePages.publishNewNotePostFromNotesPage(
      '11th Published note',
      'I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notePages.publishNewNotePostFromNotesPage(
      'Latest Published note',
      'I’m Oppia! I’m an online personal tutor for everybody!'
    );
    await notesPage.navigateToPublishTab(5);
    await notesPage.expectNumberOfPublishedNotePostsToBe(5);

    // Checking for notes on note homepage.
    await notePages.get();
    await notePages.expectNumberOfNotePostsToBe(10);
    await notePages.moveToNextPage();
    await notePages.expectNumberOfNotePostsToBe(2);
    await notePages.moveToPrevPage();
    await notePages.expectNumberOfNotePostsToBe(10);
  });
});
