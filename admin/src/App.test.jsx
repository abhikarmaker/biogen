import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./lib/api', () => ({
  adminLogin: vi.fn(),
  getOverview: vi.fn().mockResolvedValue({}),
  getUsers: vi.fn().mockResolvedValue({ users: [] }),
  updateUserPlan: vi.fn(),
  deleteUser: vi.fn(),
  getBios: vi.fn().mockResolvedValue({ bios: [] }),
  deleteBioAdmin: vi.fn(),
  getIcebreakers: vi.fn().mockResolvedValue({ icebreakers: [] }),
  deleteIcebreakerAdmin: vi.fn(),
  getErrors: vi.fn().mockResolvedValue({ errors: [] }),
  getErrorsUnreadCount: vi.fn().mockResolvedValue({ count: 0 }),
  getHealth: vi.fn().mockResolvedValue({}),
  getSettings: vi.fn().mockResolvedValue({}),
  updateSettings: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

describe('ProtectedLayout', () => {
  it('redirects to /login when no token is present', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Sign in to dashboard' })).toBeInTheDocument();
  });

  it('renders the dashboard when a token is present', async () => {
    localStorage.setItem('biogen_admin_token', 'test-token');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });
});
