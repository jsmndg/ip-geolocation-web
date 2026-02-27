import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const { mockNavigate, mockLogin, mockPost } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock('../api/axios', () => ({
  default: {
    post: mockPost,
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('logs in successfully and redirects to /home', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        token: 'jwt-token',
        user: { id: 1, name: 'User', email: 'user@example.com' },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockLogin).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
  });

  test('shows error message for failed login', async () => {
    mockPost.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
