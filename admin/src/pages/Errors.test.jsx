import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Errors from './Errors';
import { getErrors } from '../lib/api';

vi.mock('../lib/api', () => ({
  getErrors: vi.fn(),
}));
vi.mock('../lib/notifications', () => ({
  markErrorsSeen: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe('Errors page', () => {
  it('renders fetched error rows', async () => {
    getErrors.mockResolvedValue({
      errors: [
        {
          id: '1',
          type: 'gemini_error',
          message: 'boom',
          endpoint: '/api/bio/generate',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    render(<Errors />);

    expect(await screen.findByText('boom')).toBeInTheDocument();
  });

  it('shows the setup-required message when the table is missing', async () => {
    getErrors.mockResolvedValue({ setup_required: true, errors: [] });

    render(<Errors />);

    expect(await screen.findByText('Table not set up yet')).toBeInTheDocument();
  });
});
