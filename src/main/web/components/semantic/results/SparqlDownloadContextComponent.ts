/**
 * ResearchSpace
 * Copyright (C) 2020, © Trustees of the British Museum
 * Copyright (C) 2015-2019, metaphacts GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Children, ReactElement, cloneElement, createFactory } from 'react';
import * as fileSaver from 'file-saver';

import { SparqlClient, SparqlUtil } from 'platform/api/sparql';
import { Component } from 'platform/api/components';

import * as LabelsService from 'platform/api/services/resource-label';
import * as Kefir from 'kefir';
import { Rdf } from 'platform/api/rdf';

/**
 * Component to trigger the download of a SPARQL result set.
 * Downloading starts when the child element has been clicked,
 * therefore component should contain only one child element.
 * Child element could be any HTML-element (not text node).
 *
 * @example
 * <mp-sparql-context-download header="application/sparql-results+json">
 *     <button>Download SPARQL JSON</button>
 * </mp-sparql-context-download>
 *
 * @example
 * <mp-sparql-context-download filename="myresult.csv">
 *     <a href="#">Download CSV</a>
 * </mp-sparql-context-download>
 */
export interface SparqlDownloadComponentProps {
  /**
   * result mime type header (according to the standards)
   */
  header: SparqlUtil.ResultFormat;
  /**
   * (optional) file name: if provided, will be used as filename
   */
  filename?: string;
  /**
   * (optional) downloadResourceIri: if provided, will be used to retrieve the label that will be used as filename.
   * In case filename is provided, downloadResourceIri will be ignored
   */
  downloadResourceIri?: string;
  context: any
  ;
}

class SparqlDownloadContextComponent extends Component<SparqlDownloadComponentProps, {}> {
  private subscription: Kefir.Subscription;
  private onSave = (event: React.SyntheticEvent<any>) => {
    event.preventDefault();

    const results = [];
    const {downloadResourceIri, filename} = this.props
    const FALLBACK_FILENAME = 'file.csv'

    SparqlClient.sendSparqlQuery(this.props.context.resultQuery.value, this.props.header, { context: this.context.semanticContext })
      .onValue((response) => {
        results.push(response);
      })
      .onEnd(() => {
        const blob = new Blob(results, { type: this.props.header });

        if(!downloadResourceIri && !filename) {
          fileSaver.saveAs(blob, FALLBACK_FILENAME);
          return
        }

        if(filename) {
          fileSaver.saveAs(blob, filename || FALLBACK_FILENAME);
          return
        }

        if(downloadResourceIri && !filename) {
          const context = this.context.semanticContext;
          this.subscription = LabelsService.getLabel(Rdf.iri(downloadResourceIri), { context }).observe({
            value: (label) => fileSaver.saveAs(blob, label),
            error: () => fileSaver.saveAs(blob, FALLBACK_FILENAME),
          });
          return
        }

      });
  };

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  public render() {
    const child = Children.only(this.props.children) as ReactElement<any>;
    const props = {
      onClick: this.onSave,
    };

    return cloneElement(child, props);
  }
}

export type component = SparqlDownloadContextComponent;
export const component = SparqlDownloadContextComponent;
export const factory = createFactory(component);
export default component;
