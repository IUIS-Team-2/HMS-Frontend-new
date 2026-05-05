import { useState, useRef, useEffect } from 'react';

/**
 * SearchableSelect - Dropdown with search capability
 * Replaces regular <select> elements with searchable functionality
 * Supports single and multi-select, custom values, and grouping
 */
export function SearchableSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  multiple = false,
  allowCustom = false,
  groups = null, // Array of { label, items }
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [panelStyle, setPanelStyle] = useState({});
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const selected = multiple && value ? (typeof value === 'string' ? value.split(',').filter(Boolean) : value) : [value];

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const desiredHeight = 380;
    const gutter = 8;
    const spaceBelow = window.innerHeight - rect.bottom - gutter;
    const spaceAbove = rect.top - gutter;
    const openUpward = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(220, Math.min(desiredHeight, openUpward ? spaceAbove : spaceBelow));

    setPanelStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      minWidth: Math.max(rect.width, 280),
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 6, top: 'auto' }
        : { top: rect.bottom + 6, bottom: 'auto' }),
      background: '#ffffff',
      border: '1.5px solid #e2e8f0',
      borderRadius: '10px',
      boxShadow: '0 12px 40px rgba(11,37,69,.16)',
      zIndex: 9999,
      maxHeight,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      const insideTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const insidePanel = panelRef.current && panelRef.current.contains(e.target);
      if (!insideTrigger && !insidePanel && ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      calcPosition();
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('scroll', calcPosition, true);
    window.addEventListener('resize', calcPosition);
    return () => {
      window.removeEventListener('scroll', calcPosition, true);
      window.removeEventListener('resize', calcPosition);
    };
  }, [open]);

  // Filter options based on search
  const getFilteredOptions = () => {
    const searchLower = search.toLowerCase();
    
    if (groups) {
      return groups
        .map(group => ({
          ...group,
          items: group.items.filter(item =>
            item.toLowerCase().includes(searchLower) ||
            searchLower.split(' ').some(word => item.toLowerCase().includes(word))
          ),
        }))
        .filter(group => group.items.length > 0);
    }

    return [{
      label: null,
      items: options.filter(opt =>
        opt.toLowerCase().includes(searchLower) ||
        searchLower.split(' ').some(word => opt.toLowerCase().includes(word))
      ),
    }];
  };

  const handleSelect = (item) => {
    if (multiple) {
      const newSelected = Array.isArray(selected) ? [...selected] : [];
      if (newSelected.includes(item)) {
        newSelected.splice(newSelected.indexOf(item), 1);
      } else {
        newSelected.push(item);
      }
      onChange(newSelected.join(','));
    } else {
      onChange(item);
      setOpen(false);
      setSearch('');
    }
  };

  const handleRemoveChip = (item, e) => {
    e.preventDefault();
    const newSelected = selected.filter(s => s !== item);
    onChange(multiple ? newSelected.join(',') : '');
  };

  const filteredGroups = getFilteredOptions();
  const hasResults = filteredGroups.some(g => g.items.length > 0);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <div
        ref={triggerRef}
        onClick={() => !disabled && setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          border: `1.5px solid ${open ? '#0369a1' : '#e2e8f0'}`,
          borderRadius: '8px',
          background: disabled ? '#f1f5f9' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          minHeight: '40px',
          fontSize: '13px',
          color: selected && selected[0] ? '#0f172a' : '#94a3b8',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {multiple && selected[0]
            ? `${selected.length} selected`
            : selected[0] || placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            color: '#94a3b8',
            marginLeft: '8px',
            flexShrink: 0,
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Selected Chips (for multiple) */}
      {multiple && selected[0] && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {selected.map(item => (
            <div
              key={item}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '12px',
                color: '#0369a1',
              }}
            >
              <span>{item}</span>
              <span
                onClick={e => handleRemoveChip(item, e)}
                style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  lineHeight: 1,
                }}
              >
                ×
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown Panel */}
      {open && (
        <div ref={panelRef} style={panelStyle}>
          {/* Search Input */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ position: 'relative' }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  border: `1.5px solid #e2e8f0`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {!hasResults && !allowCustom && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                No results found
              </div>
            )}

            {filteredGroups.map(group => (
              <div key={group.label || 'no-group'}>
                {group.label && (
                  <div
                    style={{
                      padding: '8px 14px 5px',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    {group.label}
                  </div>
                )}
                {group.items.map(item => {
                  const isSelected = selected.includes(item);
                  return (
                    <div
                      key={item}
                      onClick={() => handleSelect(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: isSelected ? '#e0f2fe' : 'transparent',
                        borderBottom: '1px solid #e2e8f011',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {multiple && (
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: `2px solid ${isSelected ? '#0369a1' : '#cbd5e1'}`,
                            background: isSelected ? '#0369a1' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && (
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>
                      )}
                      {!multiple && (
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#0369a1' : '#cbd5e1'}`,
                            background: isSelected ? '#0369a1' : 'transparent',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span style={{ fontSize: '13px', color: isSelected ? '#0369a1' : '#0f172a', fontWeight: isSelected ? 600 : 400 }}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Add Custom Option */}
            {allowCustom && search.trim() && (
              <div
                onClick={() => {
                  handleSelect(search.trim());
                  setSearch('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: '#f0fdf4',
                  borderTop: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                <span>+</span>
                <span>Add "{search.trim()}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
