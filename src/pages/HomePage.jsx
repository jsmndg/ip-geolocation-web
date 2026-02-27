import { useEffect, useMemo, useState } from 'react';
import { isIP } from 'is-ip';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import IPInfoCard from '../components/IPInfoCard';
import MapView from '../components/MapView';
import SearchHistory from '../components/SearchHistory';

const IPINFO_TIMEOUT_MS = 10000;

function buildIpInfoUrl(ip = '') {
  const baseUrl = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json';
  const token = import.meta.env.VITE_IPINFO_TOKEN?.trim();
  if (!token) {
    return baseUrl;
  }
  return `${baseUrl}?token=${token}`;
}

function getApiErrorMessage(error, fallbackMessage) {
  if (error?.code === 'ERR_NETWORK') {
    return 'API server is unavailable. Please start the backend and retry.';
  }
  return error?.response?.data?.message || fallbackMessage;
}

async function fetchIpInfo(ip = '') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IPINFO_TIMEOUT_MS);

  try {
    const response = await fetch(buildIpInfoUrl(ip), { signal: controller.signal });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit reached from ipinfo. Please try again later.');
      }

      throw new Error(payload?.error?.title || payload?.error?.message || 'Failed to fetch IP details');
    }

    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out while contacting ipinfo. Please try again.');
    }

    if (error?.message === 'Failed to fetch') {
      throw new Error('Unable to reach ipinfo service right now. Check your internet and retry.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function HomePage() {
  const { user, logout } = useAuth();

  const [searchValue, setSearchValue] = useState('');
  const [searchError, setSearchError] = useState('');
  const [displayedGeo, setDisplayedGeo] = useState(null);
  const [ownGeo, setOwnGeo] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingHistory, setDeletingHistory] = useState(false);
  const [ipInfoError, setIpInfoError] = useState('');
  const [historyError, setHistoryError] = useState('');

  const loadDashboard = async (isMountedRef) => {
    setLoadingGeo(true);
    setLoadingHistory(true);
    setIpInfoError('');
    setHistoryError('');

    const [ipResult, historyResult] = await Promise.allSettled([
      fetchIpInfo(),
      api.get('/api/history'),
    ]);

    if (!isMountedRef.current) {
      return;
    }

    if (ipResult.status === 'fulfilled') {
      setOwnGeo(ipResult.value);
      setDisplayedGeo(ipResult.value);
    } else {
      setOwnGeo(null);
      setDisplayedGeo(null);
      const message = ipResult.reason?.message || 'Failed to load your IP info';
      setIpInfoError(message);
      toast.error(message);
    }

    if (historyResult.status === 'fulfilled') {
      setHistory(historyResult.value.data);
    } else {
      const message = getApiErrorMessage(historyResult.reason, 'Failed to load history');
      setHistoryError(message);
      toast.error(message);
    }

    setLoadingGeo(false);
    setLoadingHistory(false);
  };

  useEffect(() => {
    let isMounted = true;
    const isMountedRef = { current: true };

    async function initializeData() {
      if (!isMounted) {
        return;
      }

      await loadDashboard(isMountedRef);
    }

    initializeData();

    return () => {
      isMounted = false;
      isMountedRef.current = false;
    };
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    setSearchError('');

    const ip = searchValue.trim();
    if (!isIP(ip)) {
      setSearchError('Please enter a valid IP address');
      return;
    }

    try {
      setLoadingGeo(true);
      setIpInfoError('');
      const ipData = await fetchIpInfo(ip);

      setDisplayedGeo(ipData);

      try {
        const saved = await api.post('/api/history', {
          ip_address: ip,
          geo_data: ipData,
        });

        setHistoryError('');
        setHistory((prev) => [saved.data, ...prev]);
        toast.success('IP lookup saved');
      } catch (apiError) {
        const message = getApiErrorMessage(apiError, 'Lookup shown but failed to save history');
        setHistoryError(message);
        toast.error(message);
      }
    } catch (error) {
      const message = error.message || 'Lookup failed';
      setIpInfoError(message);
      toast.error(message);
    } finally {
      setLoadingGeo(false);
    }
  };

  const handleHistorySelect = async (ipAddress) => {
    try {
      setLoadingGeo(true);
      setIpInfoError('');
      const ipData = await fetchIpInfo(ipAddress);

      setSearchValue(ipAddress);
      setDisplayedGeo(ipData);
    } catch (error) {
      const message = error.message || 'Failed to refresh selected history item';
      setIpInfoError(message);
      toast.error(message);
    } finally {
      setLoadingGeo(false);
    }
  };

  const handleDeleteSelected = async (ids) => {
    try {
      setDeletingHistory(true);
      setHistoryError('');
      const { data } = await api.delete('/api/history', { data: { ids } });
      setHistory((prev) => prev.filter((item) => !ids.includes(item.id)));
      toast.success(`Deleted ${data.deleted} entr${data.deleted === 1 ? 'y' : 'ies'}`);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to delete selected history');
      setHistoryError(message);
      toast.error(message);
    } finally {
      setDeletingHistory(false);
    }
  };

  const clearToOwnIp = () => {
    setSearchValue('');
    setSearchError('');
    setIpInfoError('');
    setDisplayedGeo(ownGeo);
  };

  const greetingName = useMemo(() => user?.name || 'User', [user]);

  return (
    <div className="dashboard-wrap fade-in">
      <header className="topbar">
        <div>
          <h1>IP Geolocation Dashboard</h1>
          <p className="subtext">Welcome, {greetingName}</p>
        </div>
        <button type="button" className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="panel fade-in">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Enter IPv4 or IPv6"
            aria-label="IP search"
          />
          <button type="submit">Search</button>
          <button type="button" onClick={clearToOwnIp} className="secondary-btn">
            Clear
          </button>
        </form>
        {searchError ? <p className="error-text">{searchError}</p> : null}
      </section>

      <section className="dashboard-grid">
        <div className="stack-gap">
          {ipInfoError ? (
            <div className="state-box state-error">
              <p>{ipInfoError}</p>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => loadDashboard({ current: true })}
              >
                Retry Data Load
              </button>
            </div>
          ) : null}
          <IPInfoCard data={displayedGeo} loading={loadingGeo} />
        </div>
        <SearchHistory
          items={history}
          onSelect={handleHistorySelect}
          onDeleteSelected={handleDeleteSelected}
          deleting={deletingHistory}
          loading={loadingHistory}
          error={historyError}
          onRetry={() => loadDashboard({ current: true })}
        />
      </section>

      <MapView geoData={displayedGeo} />
    </div>
  );
}
