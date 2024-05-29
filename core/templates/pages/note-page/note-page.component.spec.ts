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
 * @fileoverview Unit tests for Note Home Page Component.
 */

import {Pipe} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MaterialModule} from 'modules/material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NotePageComponent} from 'pages/note-page/note-page.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {UrlService} from 'services/contextual/url.service';
import {NotesCardComponent} from 'pages/notes-page/notes-card/notes-card.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UserService} from 'services/user.service';

// This throws "TS2307". We need to
// suppress this error because rte-text-components are not strictly typed yet.
// @ts-ignore
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {SharingLinksComponent} from 'components/common-layout-directives/common-elements/sharing-links.component';
import {NotePageService} from './services/note-page.service';

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: 'note/',
      href: 'http://localhost/note/note-test',
      toString() {
        return 'http://localhost/test_path';
      },
      reload: () => {},
    },
  };
}

class MockWindowDimensionsService {
  getWidth(): number {
    return 766;
  }
}

describe('Note home page component', () => {
  let loaderService: LoaderService;
  let component: NotePageComponent;
  let fixture: ComponentFixture<NotePageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule,
        MaterialModule,
        RichTextComponentsModule,
      ],
      declarations: [
        NotePageComponent,
        NotesCardComponent,
        MockTranslatePipe,
        MockTruncatePipe,
        SharingLinksComponent,
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
        LoaderService,
        NotePageService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotePageComponent);
    component = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    loaderService = TestBed.inject(LoaderService);
    notePostPageService = TestBed.inject(NotePageService);
    mockWindowRef = TestBed.inject(WindowRef) as MockWindowRef;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    userService = TestBed.inject(UserService);
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
  });

  it('should get the note post page url', () => {
    expect(component.getPageUrl()).toBe('http://localhost/note/note-test');
  });

  it('should run the copy command successfully', () => {
    let dummyDivElement = document.createElement('div');
    let dummyTextNode = document.createTextNode('Text to be copied');
    dummyDivElement.className = 'class-name';
    dummyDivElement.appendChild(dummyTextNode);
    let dummyDocumentFragment = document.createDocumentFragment();
    dummyDocumentFragment.appendChild(dummyDivElement);
    spyOn(document, 'getElementsByClassName')
      .withArgs('class-name')
      .and.returnValue(dummyDocumentFragment.children);
    spyOn(document, 'execCommand').withArgs('copy');
    spyOn($.fn, 'tooltip');
    component.copyLink('class-name');
    expect(document.execCommand).toHaveBeenCalled();
  });
});
