import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Required User' },
    logout: vi.fn(),
  }),
}));

vi.mock('../api/axios', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  },
}));

vi.mock('../components/MapView', () => ({
  default: () => <div>Map Placeholder</div>,
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('HomePage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockDelete.mockResolvedValue({ data: { deleted: 0 } });
  });

  test('shows validation error for invalid IP', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ip: '1.1.1.1',
        city: 'Initial City',
        country: 'PH',
        loc: '14.5995,120.9842',
      }),
    });

    render(<HomePage />);

    await screen.findByText('IP Information');

    const searchInput = screen.getByLabelText('IP search');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'not-an-ip');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Please enter a valid IP address')).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('clear button resets search value and reverts to own IP info', async () => {
    const ownGeo = {
      ip: '1.1.1.1',
      city: 'Initial City',
      country: 'PH',
      loc: '14.5995,120.9842',
      org: 'Own Org',
      timezone: 'Asia/Manila',
      region: 'NCR',
      hostname: 'initial-host',
      postal: '1000',
    };

    const searchedGeo = {
      ip: '8.8.8.8',
      city: 'Mountain View',
      country: 'US',
      loc: '37.4056,-122.0775',
      org: 'Google LLC',
      timezone: 'America/Los_Angeles',
      region: 'California',
      hostname: 'dns.google',
      postal: '94043',
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ownGeo })
      .mockResolvedValueOnce({ ok: true, json: async () => searchedGeo });

    mockPost.mockResolvedValueOnce({
      data: {
        id: 1,
        ip_address: '8.8.8.8',
        geo_data: searchedGeo,
        searched_at: new Date().toISOString(),
      },
    });

    render(<HomePage />);

    await screen.findByText('Initial City');

    const searchInput = screen.getByLabelText('IP search');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, '8.8.8.8');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    await screen.findByText('Mountain View');

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(screen.getByText('Initial City')).toBeInTheDocument();
    });
  });
});
