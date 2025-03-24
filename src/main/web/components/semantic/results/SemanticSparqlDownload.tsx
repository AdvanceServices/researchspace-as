import * as React from 'react';
import { Component } from "platform/api/components";
import { SparqlDownloadComponentProps } from './SparqlDownloadContextComponent';
import { SemanticSearchContext } from 'platform/components/semantic/search/web-components/SemanticSearchApi';
import SparqlDownloadContextComponent from './SparqlDownloadContextComponent';
import { createFactory } from 'react';

class SemanticSearchFacet extends Component<SparqlDownloadComponentProps, {}> {
  render() {
    const { semanticContext } = this.context;
    return (
      <SemanticSearchContext.Consumer>
        {(context) => <SparqlDownloadContextComponent {...this.props} context={{ ...context, semanticContext }} />}
      </SemanticSearchContext.Consumer>
    );
  }
}

export type component = SemanticSearchFacet;
export const component = SemanticSearchFacet;
export const factory = createFactory(component);
export default component;
