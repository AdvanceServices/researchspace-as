import { Component } from 'platform/api/components';
import { Props } from 'react';
import * as React from 'react';

export interface SortingCellProps extends Props<SortingCell> {
  type: string;
  name: string;
  value: string;
  onFilterChange: (filter: string) => void;
}

interface State {
  value: string;
}

export default class SortingCell extends Component<SortingCellProps, State> {
  constructor(props: SortingCellProps, context: any) {
    super(props, context);
    this.state = { value: props.value ? props.value : '' };
  }

  private handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.setState({ value });
    this.props.onFilterChange(value);
  };

  render() {
    return (
      <div>
        <span>{this.props.name}</span>
        <input type="text" onClick={(e) => e.stopPropagation()} onChange={this.handleInput} value={this.state.value} />
      </div>
    );
  }
}
