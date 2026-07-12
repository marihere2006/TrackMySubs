// ============================================================
// Subscriptions Page — TrackMySubs
// Columns: Service | Category | Cost | Start Date | Expiry Date | Status | Actions
// Single ⋮ action menu replaces 4 individual buttons
// Sticky header, balanced column proportions
// ============================================================

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, ArrowUpDown, ChevronUp, ChevronDown,
  RefreshCw, CreditCard, Eye, Pencil, Trash2, MoreVertical,
} from 'lucide-react';
import { useSubscriptions } from '../context/SubscriptionContext';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import HeroHeader from '../components/layout/HeroHeader';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, daysUntilExpiry, todayStr } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatUtils';
import SubscriptionDetailModal from '../components/ui/SubscriptionDetailModal';
import ServiceLogo from '../components/ui/ServiceLogo';
import { CATEGORIES } from '../data/constants';
import styles from './SubscriptionsPage.module.css';

// ── Inline Action Menu ─────────────────────────────────────
const ActionMenu = ({ sub, onView, onEdit, onRenew, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Calculate position relative to viewport and scroll offset
  const updateCoords = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX,
      });
    }
  }, []);

  // Update coords when opening or resizing
  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      return () => window.removeEventListener('resize', updateCoords);
    }
  }, [open, updateCoords]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      // Close if click is outside both button and dropdown menu
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Close on scroll anywhere on page/table (using capture to catch scroll inside table wrapper)
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  const handle = (fn) => (e) => {
    e.stopPropagation();
    setOpen(false);
    fn();
  };

  return (
    <div className={styles.menuWrapper}>
      <button
        ref={buttonRef}
        className={styles.menuBtn}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More actions"
      >
        <MoreVertical size={15} />
      </button>

      {open && createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
            transform: 'translateX(-100%)',
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={menuRef} className={styles.menuDropdown} role="menu">
            <button
              className={styles.menuItem}
              onClick={handle(onView)}
              role="menuitem"
            >
              <Eye size={13} />
              View
            </button>
            <button
              className={styles.menuItem}
              onClick={handle(onEdit)}
              role="menuitem"
            >
              <Pencil size={13} />
              Edit
            </button>
            {sub.computedStatus === 'Expired' && (
              <button
                className={`${styles.menuItem} ${styles.menuItemRenew}`}
                onClick={handle(onRenew)}
                role="menuitem"
              >
                <RefreshCw size={13} />
                Renew
              </button>
            )}
            <div className={styles.menuDivider} role="separator" />
            <button
              className={`${styles.menuItem} ${styles.menuItemDelete}`}
              onClick={handle(onDelete)}
              role="menuitem"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────
const SubscriptionsPage = () => {
  const { subscriptions, notifications, loading, deleteSub, renewSub } = useSubscriptions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper to update a single search param
  const updateParam = (key, value) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      return prev;
    });
  };

  const search = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const statusFilter = searchParams.get('status') || '';
  const autoRenewFilter = searchParams.get('autoRenew') || '';
  const priorityFilter = searchParams.get('priority') === 'true';
  const sortParam = searchParams.get('sort') || 'expiryDate-asc';
  const [sortField, sortDir] = sortParam.includes('-') ? sortParam.split('-') : [sortParam, 'asc'];

  const [deleteModal, setDeleteModal] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [renewModal, setRenewModal] = useState(null);

  const [deleting, setDeleting] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newCost, setNewCost] = useState('');
  const [renewError, setRenewError] = useState('');

  // ── Sort handler ─────────────────────────────────────────
  const handleSort = (field) => {
    let newDir = 'asc';
    if (sortField === field && sortDir === 'asc') newDir = 'desc';
    updateParam('sort', `${field}-${newDir}`);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className={styles.sortIcon} />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className={`${styles.sortIcon} ${styles.sortActive}`} />
      : <ChevronDown size={12} className={`${styles.sortIcon} ${styles.sortActive}`} />;
  };

  // ── Filtered & sorted data ───────────────────────────────
  const filtered = useMemo(() => {
    let result = [...subscriptions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.serviceName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) result = result.filter((s) => s.category === categoryFilter);
    if (statusFilter) {
      if (statusFilter === 'Active_All') {
        result = result.filter((s) => s.computedStatus === 'Active' || s.computedStatus === 'Expiring Soon');
      } else {
        result = result.filter((s) => s.computedStatus === statusFilter);
      }
    }
    if (autoRenewFilter === 'true') result = result.filter((s) => s.autoRenewal === true);
    if (autoRenewFilter === 'false') result = result.filter((s) => s.autoRenewal === false);
    if (priorityFilter) {
      const priorityIds = new Set(notifications.map(n => n.id));
      result = result.filter((s) => priorityIds.has(s.id));
    }

    result.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (sortField === 'expiryDate' || sortField === 'startDate') {
        va = new Date(va); vb = new Date(vb);
      } else if (sortField === 'cost') {
        va = Number(va); vb = Number(vb);
      } else {
        va = String(va || '').toLowerCase(); vb = String(vb || '').toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [subscriptions, search, categoryFilter, statusFilter, autoRenewFilter, priorityFilter, sortField, sortDir, notifications]);

  // ── Delete ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await deleteSub(deleteModal.id);
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  // ── Renew modal open ────────────────────────────────────
  const openRenewModal = useCallback((sub) => {
    setRenewModal(sub);
    setNewExpiryDate('');
    setNewCost(sub.cost);
    setRenewError('');
  }, []);

  // ── Renew submit ────────────────────────────────────────
  const handleRenewSubmit = async () => {
    if (!newExpiryDate) {
      setRenewError('Please select a new expiry date.');
      return;
    }
    const today = todayStr();
    if (newExpiryDate <= today) {
      setRenewError('New expiry date must be after today.');
      return;
    }
    if (newExpiryDate <= renewModal.startDate) {
      setRenewError('New expiry date must be after the start date.');
      return;
    }
    setRenewLoading(true);
    setRenewError('');
    try {
      await renewSub(renewModal.id, newExpiryDate, Number(newCost));
      setRenewModal(null);
    } catch (err) {
      setRenewError(err.message || 'Renewal failed.');
    } finally {
      setRenewLoading(false);
    }
  };

  const tableColgroup = (
    <colgroup>
      {/* Service 24% | Category 15% | Cost 11% | Start 12% | Expiry 13% | Status 150px | Actions 80px */}
      <col style={{ width: '24%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '11%' }} />
      <col style={{ width: '12%' }} />
      <col style={{ width: '13%' }} />
      <col style={{ width: '150px' }} />
      <col style={{ width: '80px' }} />
    </colgroup>
  );

  return (
    <div className={styles.page}>
      <HeroHeader
        breadcrumb="Subscriptions"
        title="Subscriptions"
        subtitle="Manage all your active and past subscriptions."
      />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="search"
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className={styles.searchInput}
            id="sub-search"
            placeholder="Search subscriptions..."
          />
        </div>
        <div className={styles.filters}>
          <select
            value={categoryFilter}
            onChange={(e) => updateParam('category', e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => updateParam('status', e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="Active_All">All Active</option>
            <option value="Active">Active Only</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
          <select
            value={autoRenewFilter}
            onChange={(e) => updateParam('autoRenew', e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by auto renewal"
          >
            <option value="">All Auto Renew</option>
            <option value="true">Auto Renew: Enabled</option>
            <option value="false">Auto Renew: Disabled</option>
          </select>
          <select
            value={priorityFilter ? 'true' : ''}
            onChange={(e) => updateParam('priority', e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            <option value="true">Priority Only</option>
          </select>
        </div>
        <Link to="/add-subscription" className={styles.addBtn}>
          <Plus size={15} /> Add New
        </Link>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <table className={styles.table}>
            {tableColgroup}
            <thead>
              <tr>
                <th className={styles.th}>Service</th>
                <th className={styles.th}>Category</th>
                <th className={`${styles.th} ${styles.thRight}`}>Cost</th>
                <th className={styles.th}>Start Date</th>
                <th className={styles.th}>Expiry Date</th>
                <th className={styles.th}>Status</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <Skeleton variant="table-row" count={5} />
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={search || categoryFilter || statusFilter ? 'No results found' : 'No subscriptions yet'}
            description={
              search || categoryFilter || statusFilter
                ? 'Try adjusting your search or filters.'
                : 'Add your first subscription to start tracking.'
            }
            actionLabel={(!search && !categoryFilter && !statusFilter) ? 'Add Subscription' : undefined}
            actionTo="/add-subscription"
          />
        ) : (
          <table className={styles.table}>
            {tableColgroup}
            <thead className={styles.stickyHead}>
              <tr>
                <th className={styles.th}>Service</th>
                <th className={`${styles.th} ${styles.thSort}`} onClick={() => handleSort('category')}>
                  Category {renderSortIcon('category')}
                </th>
                <th className={`${styles.th} ${styles.thSort} ${styles.thRight}`} onClick={() => handleSort('cost')}>
                  Cost {renderSortIcon('cost')}
                </th>
                <th className={styles.th}>Start Date</th>
                <th className={`${styles.th} ${styles.thSort}`} onClick={() => handleSort('expiryDate')}>
                  Expiry Date {renderSortIcon('expiryDate')}
                </th>
                <th className={styles.th}>Status</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const days = daysUntilExpiry(sub.expiryDate);
                return (
                  <tr key={sub.id} className={styles.tr} onClick={() => setSelectedSubscription(sub)} style={{ cursor: 'pointer' }}>
                    {/* Service */}
                    <td className={styles.td}>
                      <div className={styles.serviceCell} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ServiceLogo serviceName={sub.serviceName} website={sub.website} size={24} />
                        <span className={styles.serviceName}>{sub.serviceName}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className={styles.td}>
                      <span className={styles.categoryTag}>{sub.category}</span>
                    </td>

                    {/* Cost — right-aligned */}
                    <td className={`${styles.td} ${styles.costCell}`}>
                      {formatCurrency(sub.cost)}
                    </td>

                    {/* Start Date */}
                    <td className={`${styles.td} ${styles.dateCell}`}>
                      {formatDate(sub.startDate)}
                    </td>

                    {/* Expiry Date */}
                    <td className={`${styles.td} ${styles.dateCell}`}>
                      <span>{formatDate(sub.expiryDate)}</span>
                      {days >= 0 && days <= 7 && (
                        <span className={styles.expiryWarn}>
                          {days === 0 ? 'today' : `${days}d left`}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className={`${styles.td} ${styles.statusCell}`}>
                      <Badge label={sub.computedStatus} dot />
                    </td>

                    {/* Actions — single ⋮ menu */}
                    <td className={`${styles.td} ${styles.actionsCell}`}>
                      <ActionMenu
                        sub={sub}
                        onView={() => setSelectedSubscription(sub)}
                        onEdit={() => navigate(`/edit-subscription/${sub.id}`)}
                        onRenew={() => openRenewModal(sub)}
                        onDelete={() => setDeleteModal(sub)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className={styles.resultCount}>
          {filtered.length} of {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Renew Modal ───────────────────────────────────── */}
      <Modal
        isOpen={Boolean(renewModal)}
        onClose={() => setRenewModal(null)}
        title={`Renew — ${renewModal?.serviceName || ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenewModal(null)}>Cancel</Button>
            <Button variant="success" onClick={handleRenewSubmit} loading={renewLoading} icon={RefreshCw}>
              Confirm Renewal
            </Button>
          </>
        }
      >
        {renewModal && (
          <div className={styles.renewBody}>
            <div className={styles.renewInfo}>
              <div>
                <p className={styles.renewName}>{renewModal.serviceName}</p>
                <p className={styles.renewMeta}>
                  Previous period: {formatDate(renewModal.startDate)} → {formatDate(renewModal.expiryDate)}
                </p>
              </div>
            </div>
            <div className={styles.renewFormField}>
              <label htmlFor="new-expiry" className={styles.renewLabel}>
                New Expiry Date <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                id="new-expiry"
                type="date"
                min={todayStr()}
                value={newExpiryDate}
                onChange={(e) => { setNewExpiryDate(e.target.value); setRenewError(''); }}
                className={`${styles.renewDateInput} ${renewError ? styles.inputErr : ''}`}
                style={{ marginBottom: 12 }}
              />
              <label htmlFor="new-cost" className={styles.renewLabel}>
                Cost (₹) <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                id="new-cost"
                type="number"
                min="0"
                step="0.01"
                value={newCost}
                onChange={(e) => { setNewCost(e.target.value); setRenewError(''); }}
                className={`${styles.renewDateInput} ${renewError ? styles.inputErr : ''}`}
              />
              {renewError && <p className={styles.renewError}>{renewError}</p>}
              <p className={styles.renewHint}>
                New start date will be set to <strong>today</strong>. Previous period will be archived to history.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ──────────────────────────────────── */}
      <Modal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        title="Delete Subscription"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </>
        }
      >
        <p className={styles.modalText}>
          Are you sure you want to delete{' '}
          <strong>{deleteModal?.serviceName}</strong>?
          This action cannot be undone.
        </p>
      </Modal>

      <SubscriptionDetailModal
        isOpen={Boolean(selectedSubscription)}
        onClose={() => setSelectedSubscription(null)}
        subscription={selectedSubscription}
      />
    </div>
  );
};

export default SubscriptionsPage;
