import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon, PageHeader } from './ui';

describe('design-system primitives', () => {
  it('renders mapped Material names as local Lucide SVGs', () => {
    const { container } = render(
      <>
        <Icon name="home" />
        <Icon name="workspace_premium" />
        <Icon name="cleaning_services" />
      </>,
    );

    expect(container.querySelectorAll('svg.icon')).toHaveLength(3);
    expect(container.querySelector('svg[data-icon="workspace_premium"]')).toBeInTheDocument();
  });

  it('falls back safely for an unmapped icon', () => {
    const { container } = render(<Icon name="not_a_real_icon" />);
    expect(container.querySelector('svg[data-icon="not_a_real_icon"]')).toBeInTheDocument();
  });

  it('renders a page header with optional subtitle and actions', () => {
    const { getByRole, getByText } = render(
      <PageHeader
        title="Guests"
        subtitle="Find and manage guests"
        actions={<button type="button">Add guest</button>}
      />,
    );

    expect(getByRole('heading', { name: 'Guests' })).toBeInTheDocument();
    expect(getByText('Find and manage guests')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Add guest' })).toBeInTheDocument();
  });
});
