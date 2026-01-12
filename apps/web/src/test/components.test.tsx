import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple test component
const Button = ({ children, onClick, disabled = false }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button onClick={onClick} disabled={disabled} data-testid="button">
    {children}
  </button>
);

const Card = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div data-testid="card">
    <h2>{title}</h2>
    {children}
  </div>
);

const LoadingSpinner = () => (
  <div data-testid="loading-spinner" role="status">
    Loading...
  </div>
);

describe('Component Tests', () => {
  describe('Button', () => {
    it('should render with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      screen.getByTestId('button').click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByTestId('button')).toBeDisabled();
    });
  });

  describe('Card', () => {
    it('should render title', () => {
      render(<Card title="Test Card" />);
      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(<Card title="Card">Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });
  });

  describe('LoadingSpinner', () => {
    it('should render loading state', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should have status role for accessibility', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

describe('Accessibility Tests', () => {
  it('should have proper button semantics', () => {
    render(<Button>Accessible Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
