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
import { parseQuerySync } from 'platform/api/sparql/SparqlUtil';
import * as SparqlJs from 'sparqljs';
import { trigger } from 'platform/api/events';
import { ComponentTemplateUpdate } from 'platform/api/events/BuiltInEvents';

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
  rules: { relation: string; min: number; max: number; message: string }[];
  context: any;
  queryExtension?: string;
  columnHeaders?: { variable: string; columnName: string }[];
  extendVariables?: { name: string; type: string; preQuery?: string }[];
  excludeRelations?: string[];
  target?: string;
}

class SparqlDownloadContextComponent extends Component<SparqlDownloadComponentProps, {isLoading: boolean}> {
  private subscription: Kefir.Subscription;

  constructor(props: SparqlDownloadComponentProps, context: any) {
    super(props, context);
    this.state = {
      isLoading: false,
    };
  }
  private onSave = async (event: React.SyntheticEvent<any>) => {
    this.setState({ isLoading: true });
    event.preventDefault();

    const results = [];
    const { downloadResourceIri, filename } = this.props;
    const FALLBACK_FILENAME = 'file.csv';

    const originalQuery: SparqlJs.SelectQuery = this.props.context.resultQuery.get();
    const generator = new SparqlJs.Generator();
    const query: SparqlJs.SelectQuery = parseQuerySync(generator.stringify(originalQuery));

    if (this.props.extendVariables) {
      const extendedResults: { [key: string]: { results: { bindings: { relation: { value: string } }[] } } } = {};
      const streams = [];

      for (const variable of this.props.extendVariables) {
        const constantTerm = `${variable.preQuery ?? ''} ?${variable.name} a ${variable.type}. ?${
          variable.name
        } ?relation ?individual.`;
        const filterRelations = !this.props.excludeRelations
          ? ''
          : this.props.excludeRelations.map((relation) => `FILTER (?relation != ${relation})`).join('\n');

        const extendedQuery = `SELECT DISTINCT ?relation WHERE {
          ${constantTerm}
          ${filterRelations}
          FILTER(!isIRI(?individual) && !isBlank(?individual)).
        }`;

        const stream = SparqlClient.sendSparqlQuery(extendedQuery, 'application/json', {
          context: this.context.semanticContext,
        }).onValue((res) => (extendedResults[variable.name] = JSON.parse(res)));
        streams.push(stream);
      }

      await Kefir.merge(streams).toPromise();

      const wherePattern = Object.entries(extendedResults)
        .map(([key, value]) => {
          const entries = [];
          for (const item of value.results.bindings) {
            const relation = item.relation.value;
            let relationLabel = relation.split('#')[relation.split('#').length - 1];
            relationLabel = relationLabel.split('/')[relationLabel.split('/').length - 1];

            const individual = `?${relationLabel}`;
            // @ts-ignore
            query.variables.push(individual);
            entries.push(`OPTIONAL { FILTER(BOUND(?${key})). ?${key} <${relation}> ${individual}. }`);
          }

          return entries.join('\n');
        })
        .join('\n');

      const extraQueryRaw = `
        SELECT * WHERE {
          ${wherePattern}
        }
      `;

      const extraQuery = parseQuerySync(extraQueryRaw);
      if (extraQuery.type === 'query' && extraQuery.queryType === 'SELECT') {
        query.where.push(...extraQuery.where);
      }
    } else if (this.props.queryExtension) {
      const extraQuery = parseQuerySync(this.props.queryExtension);
      if (extraQuery.type === 'query' && extraQuery.queryType === 'SELECT') {
        extraQuery.variables.forEach((el) => query.variables.push(el));

        query.where.push(...extraQuery.where);
      }
    }

    SparqlClient.sendSparqlQuery(query, this.props.header, { context: this.context.semanticContext })
      .onValue((response) => {
        results.push(response);
      })
      .onEnd(() => {
        this.setState({ isLoading: false });
        let headers = results[0].split('\r\n')[0];

        for (const item of this.props.columnHeaders) {
          headers = headers.replace(`?${item.variable}`, item.columnName);
        }
        headers = headers.replaceAll('?', '');

        const blob = new Blob([headers + '\r\n' + results[0].split('\r\n').slice(1).join('\r\n')], {
          type: this.props.header,
        });

        if (!downloadResourceIri && !filename) {
          fileSaver.saveAs(blob, FALLBACK_FILENAME);
          return;
        }

        if (filename) {
          fileSaver.saveAs(blob, filename || FALLBACK_FILENAME);
          return;
        }

        if (downloadResourceIri && !filename) {
          const context = this.context.semanticContext;
          this.subscription = LabelsService.getLabel(Rdf.iri(downloadResourceIri), { context }).observe({
            value: (label) => fileSaver.saveAs(blob, label),
            error: () => fileSaver.saveAs(blob, FALLBACK_FILENAME),
          });
          return;
        }
      });
  };

  componentDidMount() {
    this.props.context.setRules(this.props.rules);
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  private areRulesSatisfied(): boolean {
    if (!this.props.rules) return true;

    const relationsToIgnore =
      this.props.context.facetRelations?.value?.filter((r) => !r.available).map((r) => r.iri.value) || [];
    const effectiveRules = this.props.rules.filter((r) => !relationsToIgnore.includes(r.relation));

    const filteredFacets = this.props.context.selectedFacets.filter((f) =>
      effectiveRules.find((r) => r.relation === f.relation.iri.value)
    );
    if (effectiveRules.length > 0 && filteredFacets.every((f) => f.values.length === 0)) return false;

    return effectiveRules.every((r) => {
      const facet = filteredFacets.find((f) => f.relation.iri.value === r.relation);

      if (!facet) return false;

      return r.min <= facet.values.length && r.max >= facet.values.length;
    });
  }

  public render() {
    const child = Children.only(this.props.children) as ReactElement<any>;
    const props = {};
    if (this.state.isLoading) {
      props['onClick'] = () => window.alert('Please wait, the download is in progress...');
      props['style'] = {
        cursor: 'wait',
        opacity: 0.5,
      };
    } else if (this.areRulesSatisfied()) {
      props['onClick'] = this.onSave;
    } else {
      props['onClick'] = () => {
        window.alert(this.props.rules.map((r) => r.message).join('\n'));

        const firstUnsatisfiedRule = this.props.rules.find((r) => {
          const facet = this.props.context.selectedFacets.find((f) => f.relation.iri.value === r.relation);
          if (!facet) return true;

          return r.min > facet.values.length || r.max < facet.values.length;
        });
        this.props.context.facetActions.value.selectRelation(firstUnsatisfiedRule.relation);

        if (this.props.target) {
          trigger({
            eventType: ComponentTemplateUpdate,
            source: Math.random().toString(),
            targets: [this.props.target],
            data: {},
          });
        }
      };
      props['style'] = {
        cursor: 'not-allowed',
        opacity: 0.5,
      };
    }

    return cloneElement(child, props);
  }
}

export type component = SparqlDownloadContextComponent;
export const component = SparqlDownloadContextComponent;
export const factory = createFactory(component);
export default component;
