import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { theme } from 'antd';

jest.mock('./layout/Layout', () => {
  return function MockedLayout() {
    return <div data-testid="mocked-layout">Mocked Layout</div>;
  };
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('mocked-layout')).toBeInTheDocument();
  });
});
