import * as React from 'react';
import { Component } from 'platform/api/components';
import { Props } from 'react';
import * as Griddle from 'griddle-react';
import ReactSelect from 'react-select';

export interface CustomGriddleProps extends Props<CustomGriddle> {
  griddleProps: Griddle.GriddleConfig;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default class CustomGriddle extends Component<CustomGriddleProps, {}> {
  render() {
    return (
      <div className="filter-container">
        <div style={{ display: "flex" }}>
          <input placeholder="Quick Search" type="text" className="form-control" value={this.props.searchQuery} onChange={e => this.props.onSearchChange(e.target.value)} />
          <ReactSelect
            options={[10, 25, 50, 100].map(val => ({ label: `${val} Rows`, value: val }))}
            value={this.props.griddleProps.resultsPerPage}
            clearable={false}
            style={{
              width: "5vw"
            }}
            onChange={val => {
              if ("value" in val) {
                // @ts-ignore
                this.props.griddleProps.externalSetPageSize(val.value)
              }
            }}
          />
        </div>
        <Griddle {...this.props.griddleProps} showFilter={false} />
      </div>
    )
  }
}
