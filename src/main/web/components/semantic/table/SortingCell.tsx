import { Component } from 'platform/api/components';
import { Props } from 'react';
import * as React from 'react';

export interface SortingCellProps extends Props<SortingCell> {
  name: string;
  value: string;
  onFilterChange: (value: string) => void;
}

interface State {
  value: string;
  inputVisible: boolean;
}

export default class SortingCell extends Component<SortingCellProps, State> {
  constructor(props: SortingCellProps, context: any) {
    super(props, context);
    this.state = {
      value: props.value ? props.value : '',
      inputVisible: false
    };
  }

  private handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.setState({ value });
    this.props.onFilterChange(value);
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
            style={{ marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <img
              src="/images/filter.svg"
              alt="Filter"
              style={{ width: '16px', height: '16px', color: 'red' }}
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
              padding: '8px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              width: '200px'
            }}
          >
            <input
              type="text"
              onClick={(e) => e.stopPropagation()}
              onChange={this.handleInput}
              value={this.state.value}
              style={{ width: '100%', padding: '4px' }}
              placeholder="Filter"
            />
          </div>
        )}
      </div>
    );
  }
}
