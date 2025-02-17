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
  inputVisible: boolean;
}

export default class SortingCellDate extends Component<SortingCellProps, State> {
  constructor(props: SortingCellProps, context: any) {
    super(props, context);
    this.state = {
      value: props.value
        ? props.value
        : { filter: { date: { from: '', to: '' }, filterType: 'date', variableType: 'uri', text: '' } },
      inputVisible: false
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

  private toggleInputVisibility = () => {
    this.setState((prevState) => ({ inputVisible: !prevState.inputVisible }));
  };

  render() {
        return (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{this.props.name}</span>
              <button
                onClick={this.toggleInputVisibility}
                style={{ marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                <img
                  src="/images/filter.svg"
                  alt="Filter"
                  style={{ width: '16px', height: '16px' }}
                />
              </button>
            </div>
            {this.state.inputVisible && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  padding: '16px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  width: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <input
                  type="date"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => this.handleInput(e, 'from')}
                  value={this.state.value.filter.date.from}
                  placeholder="From"
                  style={{ width: '100%', padding: '8px' }}
                />
                <input
                  type="date"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => this.handleInput(e, 'to')}
                  value={this.state.value.filter.date.to}
                  placeholder="To"
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            )}
          </div>
        );
  }
}
