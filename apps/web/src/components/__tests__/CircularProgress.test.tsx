import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress } from '../CircularProgress';

describe('CircularProgress', () => {
  it('renders with correct value and label', () => {
    render(<CircularProgress value={75} max={100} label="Progress" />);
    
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(<CircularProgress value={50} max={200} label="Test" showPercentage={true} />);
    
    // 50/200 = 25%
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('handles max value correctly', () => {
    render(<CircularProgress value={100} max={100} label="Complete" />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('applies custom size classes', () => {
    const { container } = render(
      <CircularProgress value={50} max={100} label="Test" size="lg" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains('w-32')).toBe(true);
    expect(wrapper.classList.contains('h-32')).toBe(true);
  });

  it('applies custom color', () => {
    const { container } = render(
      <CircularProgress value={50} max={100} label="Test" color="#FF0000" />
    );
    
    // Check if color is applied to stroke
    const circle = container.querySelector('motion.circle') || container.querySelector('circle[stroke="#FF0000"]');
    expect(circle).toBeTruthy();
  });
});


