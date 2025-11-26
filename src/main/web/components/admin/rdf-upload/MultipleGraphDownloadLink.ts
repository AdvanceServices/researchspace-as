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

import { Props as ReactProps, createElement } from 'react';
import * as D from 'react-dom-factories';
import { startsWith, endsWith } from 'lodash';
import * as moment from 'moment';
import * as classnames from 'classnames';
import * as Kefir from 'kefir';

import { Component } from 'platform/api/components';
import { Rdf } from 'platform/api/rdf';
import { SparqlUtil } from 'platform/api/sparql';
import { RDFGraphStoreService } from 'platform/api/services/rdf-graph-store';

import './GraphActionLink.scss';
import { Spinner } from 'platform/components/ui/spinner';

const CLASS = 'mp-rdf-graph-action';

export interface Props extends ReactProps<GraphActionLink> {
  graphuris: string | string[];
  fileEnding?: string;
  className?: string;
  graphDescription?: string;
  eventOverlayId?: string;
  turtleString?: string;
}

export interface State {
  isInProcess?: boolean;
}

export class GraphActionLink extends Component<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);
    this.state = { isInProcess: false };
  }

  render() {
    return D.span(
      {
        className: classnames(this.props.className, CLASS),
        onClick: this.onClick,
      },
      this.state.isInProcess
        ? D.div(
            { className: `${CLASS}__spinner-wrap` },
            createElement(Spinner, { spinnerDelay: 0, className: `${CLASS}__spinner` }),
            D.span({ className: `${CLASS}__hide` }, this.props.children)
          )
        : this.props.children
    );
  }

  onClick = () => {
    if (this.state.isInProcess) {
      return;
    }

    this.setState({ isInProcess: true });
    const { repository } = this.context.semanticContext;

    const graphuris = typeof this.props.graphuris === "string" ? this.props.graphuris.split(",") : this.props.graphuris;
    const acceptHeader = SparqlUtil.getMimeType(this.props.fileEnding);
    const ending =
      this.props.fileEnding && endsWith(graphuris[0], this.props.fileEnding) ? '' : this.props.fileEnding;
    const fileName = startsWith(graphuris[0], 'file:///')
      ? graphuris[0].replace('file:///', '') + ending
      : 'graph-export-' + moment().format('YYYY-MM-DDTHH-mm-ss') + '.' + ending;

    RDFGraphStoreService.downloadGraphTexts({
      targetGraphs: graphuris.map(graphuri => Rdf.iri(graphuri)),
      acceptHeader,
      fileName,
      repository,
    }).onValue((v) => {
      RDFGraphStoreService.download(v, acceptHeader, fileName);
    })
    .onAny(() => {
      this.setState({ isInProcess: false });
    });
  };
}

export default GraphActionLink;
