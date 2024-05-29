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
 * @fileoverview End-to-end tests for the note Dashboard page.
 */

var forms = require('../webdriverio_utils/forms.js');
var users = require('../webdriverio_utils/users.js');
var general = require('../webdriverio_utils/general.js');

var NotesPage = require('../webdriverio_utils/NotesPage.js');

describe('Notes Page functionality', function () {
  var notesPage = null;

  beforeAll(async function () {
    notesPage = new NotesPage.NotesPage();
    await users.createUserWithRole('note@notes.com', 'note', 'note admin');
    await users.login('note@notes.com');
    await notesPage.get();
  });

  it(
    'should create, publish, and delete the published note post from' +
      ' dashboard.',
    async function () {
      await notesPage.createNewBlogPost();
      await notesPage.publishNewBlogPost(
        'Sample note post Title',
        await forms.toRichText(
          'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'
        )
      );
      await notesPage.navigateToNotesPageWithBackButton();
      await notesPage.navigateToDraftsTab();
      await notesPage.expectNumberOfDraftBlogPostsToBe(0);

      await notesPage.navigateToPublishTab();
      await notesPage.expectNumberOfPublishedBlogPostsToBe(1);
      await notesPage.deleteBlogPostWithTitle('Sample note post Title');
      await notesPage.notesIntroMessageIsVisible();
    }
  );

  it(
    'should create multiple note posts both published and drafts and' +
      ' check for navigation through list view',
    async function () {
      await notesPage.createNewBlogPost();
      await notesPage.saveBlogPostAsDraft(
        'Sample Title1',
        await forms.toRichText(
          'Hi there, I’m Oppia! I’m an online personal tutor for everybody!'
        )
      );
      await notesPage.navigateToNotesPageWithBackButton();

      await notesPage.createNewBlogPost();
      await notesPage.saveBlogPostAsDraft(
        'Sample Title2',
        await forms.toRichText(
          'Hi there, I’m Oppia! I’m a tutor for everybody!'
        )
      );
      await notesPage.navigateToNotesPageWithBackButton();

      await notesPage.createNewBlogPost();
      await notesPage.saveBlogPostAsDraft(
        'Sample Title3',
        await forms.toRichText(
          'Hi there, I’m Oppia! I’m a tutor for everybody here!'
        )
      );
      await notesPage.navigateToNotesPageWithBackButton();

      await notesPage.expectNumberOfDraftBlogPostsToBe(3);

      await notesPage.getListView();
      await notesPage.expectNumberOfBlogPostsRowsToBe(3);
      await notesPage.navigateToBlogPostEditorWithTitleFromList(
        'Sample Title2'
      );
      await notesPage.navigateToNotesPageWithBackButton();
      await notesPage.navigateToDraftsTab();

      await notesPage.getListView();
      await notesPage.expectNumberOfBlogPostsRowsToBe(2);

      await notesPage.getTilesView();
      await notesPage.expectNumberOfDraftBlogPostsToBe(2);

      await notesPage.navigateToPublishTab();
      await notesPage.expectNumberOfPublishedBlogPostsToBe(1);
    }
  );

  afterEach(async function () {
    await general.checkForConsoleErrors([]);
  });

  afterAll(async function () {
    await users.logout();
  });
});
