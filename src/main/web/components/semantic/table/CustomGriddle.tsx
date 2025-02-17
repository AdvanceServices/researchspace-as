import * as React from 'react';
import { Component } from 'platform/api/components';
import { Props } from 'react';
import * as Griddle from 'griddle-react';

export interface CustomGriddleProps extends Props<CustomGriddle> {
  griddleProps: Griddle.GriddleConfig;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default class CustomGriddle extends Component<CustomGriddleProps, {}> {
  render() {
    return (
      <div className="filter-container">
        <input placeholder="Quick Search" type="text" className="form-control" value={this.props.searchQuery} onChange={e => this.props.onSearchChange(e.target.value)} />
        <Griddle {...this.props.griddleProps} showFilter={false} />
      </div>
    )
  }
}
