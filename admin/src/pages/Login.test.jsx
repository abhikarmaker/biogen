import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { adminLogin } from '../lib/api';

vi.mock('../lib/api', () => ({
  adminLogin: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login', () => {
  it('renders with empty fields and no demo credentials hint', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('admin@example.com').value).toBe('');
    expect(screen.getByPlaceholderText('••••••••').value).toBe('');
    expect(screen.queryByText(/Demo:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin123/)).not.toBeInTheDocument();
  });

  it('stores the token and navigates on successful login', async () => {
    adminLogin.mockResolvedValue({ token: 'abc123' });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), {
      target: { value: 'admin@biogen.app' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'realpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(localStorage.getItem('biogen_admin_token')).toBe('abc123'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows an error message when login fails', async () => {
    adminLogin.mockRejectedValue(new Error('Invalid credentials'));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), {
      target: { value: 'admin@biogen.app' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
