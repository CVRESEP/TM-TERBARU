import React, { useState, useEffect, useRef } from 'react';

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = '-- Cari atau Pilih --',
  required = false,
  disabled = false,
  className = '',
  style = {},
  allowEmpty = false,
  emptyLabel = '-- Kosongkan / Bebas --',
  emptyValue = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Find currently selected option
  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Sync displayed search text when value or options change and dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchText(selectedOption ? selectedOption.label : '');
    }
  }, [value, selectedOption, isOpen]);

  // Filter options based on search text when open
  const filteredOptions = React.useMemo(() => {
    if (!searchText.trim() || (selectedOption && searchText === selectedOption.label && !isOpen)) {
      return options;
    }
    const query = searchText.toLowerCase().trim();
    return options.filter(opt => {
      const labelMatch = (opt.label || '').toLowerCase().includes(query);
      const subMatch = (opt.sublabel || '').toLowerCase().includes(query);
      const valMatch = String(opt.value || '').toLowerCase().includes(query);
      return labelMatch || subMatch || valMatch;
    });
  }, [options, searchText, selectedOption, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchText(selectedOption ? selectedOption.label : '');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const handleSelect = (optValue) => {
    if (onChange) {
      onChange({ target: { value: optValue } });
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchText('');
    if (onChange) {
      onChange({ target: { value: emptyValue } });
    }
    setIsOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0;
      setHighlightedIndex(nextIndex);
      scrollItemIntoView(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1;
      setHighlightedIndex(prevIndex);
      scrollItemIntoView(prevIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchText(selectedOption ? selectedOption.label : '');
      setHighlightedIndex(-1);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setSearchText(selectedOption ? selectedOption.label : '');
    }
  };

  const scrollItemIntoView = (index) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.searchable-option-item');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`searchable-select-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          width: '100%'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          style={{
            width: '100%',
            paddingRight: value ? '52px' : '30px',
            backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
            cursor: disabled ? 'not-allowed' : 'text',
            fontWeight: selectedOption ? 600 : 400,
            fontSize: '13px'
          }}
          placeholder={placeholder}
          value={searchText}
          disabled={disabled}
          required={required && !value}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />

        <div 
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: disabled ? 'none' : 'auto'
          }}
        >
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Hapus Pilihan"
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '13px',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          )}
          <span 
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen && inputRef.current) inputRef.current.focus();
              }
            }}
            style={{
              color: '#6b7280',
              fontSize: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '2px 4px'
            }}
          >
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          ref={listRef}
          className="searchable-dropdown-list"
          style={{
            position: 'absolute',
            top: 'calc(100% + 2px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px 0'
          }}
        >
          {allowEmpty && (
            <div
              className={`searchable-option-item ${!value ? 'selected' : ''}`}
              onClick={() => handleSelect(emptyValue)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#6b7280',
                fontStyle: 'italic',
                backgroundColor: !value ? '#eff6ff' : 'transparent',
                borderBottom: '1px solid #f1f5f9'
              }}
              onMouseEnter={() => setHighlightedIndex(-1)}
            >
              {emptyLabel}
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
              Tidak ada hasil yang cocok dengan "<strong>{searchText}</strong>"
            </div>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={opt.value || index}
                  className={`searchable-option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: isHighlighted ? '#f0fdf4' : isSelected ? '#eff6ff' : 'transparent',
                    borderLeft: isSelected ? '3px solid #15803d' : '3px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'background-color 0.1s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#15803d' : '#1e293b', fontSize: '13px' }}>
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span className="badge badge-info" style={{ fontSize: '10px', padding: '1px 5px' }}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {opt.sublabel && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {opt.sublabel}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
