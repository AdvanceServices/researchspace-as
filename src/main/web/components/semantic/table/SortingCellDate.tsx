import { Component } from 'platform/api/components';
import { Props } from 'react';
import * as React from 'react';
import { Filter } from './ServerSideSemanticTable';

export interface SortingCellProps extends Props<SortingCellDate> {
  name: string;
  value: Pick<Filter, 'filter'>;
  onFilterChange: (filter: Pick<Filter, 'filter'>) => void;
}

interface State {
  value: Pick<Filter, 'filter'>;
}

export default class SortingCellDate extends Component<SortingCellProps, State> {
  constructor(props: SortingCellProps, context: any) {
    super(props, context);
    this.state = {
      value: props.value
        ? props.value
        : { filter: { date: { from: '', to: '' }, filterType: 'date', variableType: 'uri', text: '' } },
    };
  }

  private handleInput = (e: React.ChangeEvent<HTMLInputElement>, range: 'from' | 'to') => {
    const value = e.target.value;
    let filters = this.state.value;
    if (range === 'from') {
      filters = { filter: { ...filters.filter, date: { ...filters.filter.date, from: value } } };
    } else if (range === 'to') {
      filters = { filter: { ...filters.filter, date: { ...filters.filter.date, to: value } } };
    }
    this.setState({ value: filters });
    this.props.onFilterChange(filters);
  };

  render() {
    return (
      <div>
        <span>{this.props.name}</span>
        <input
          type="date"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => this.handleInput(e, 'from')}
          value={this.state.value.filter.date.from}
        />
        <input
          type="date"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => this.handleInput(e, 'to')}
          value={this.state.value.filter.date.to}
        />
      </div>
    );
  }
}
