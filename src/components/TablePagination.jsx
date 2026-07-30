import React from 'react';

export default function TablePagination({ 
  currentPage, 
  totalPages, 
  setCurrentPage, 
  totalItems,
  itemsPerPage = 10,
  setItemsPerPage
}) {
  if (totalItems === 0) return null;

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const generatePages = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 16px',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: '#fff',
      borderBottomLeftRadius: '4px',
      borderBottomRightRadius: '4px',
      flexWrap: 'wrap',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
        <div>
          Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total: <strong>{totalItems}</strong> item)
        </div>
        {setItemsPerPage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(e.target.value)}
              style={{
                padding: '3px 8px',
                fontSize: '13px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#fff',
                color: '#374151',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={10}>10 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
              <option value="all">Semua</option>
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={handlePrev}
            disabled={currentPage === 1}
            style={{
              padding: '4px 10px',
              fontSize: '13px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
            }}
          >
            &laquo; Prev
          </button>
          
          {generatePages().map((p, idx) => (
            <button
              key={idx}
              onClick={() => typeof p === 'number' && setCurrentPage(p)}
              disabled={p === '...'}
              style={{
                padding: '4px 10px',
                fontSize: '13px',
                cursor: typeof p === 'number' ? 'pointer' : 'default',
                backgroundColor: p === currentPage ? '#15803d' : '#fff',
                color: p === currentPage ? '#fff' : '#374151',
                border: p === '...' ? 'none' : '1px solid var(--border-color)',
                borderRadius: '4px',
                fontWeight: p === currentPage ? 700 : 400
              }}
            >
              {p}
            </button>
          ))}

          <button 
            onClick={handleNext}
            disabled={currentPage === totalPages}
            style={{
              padding: '4px 10px',
              fontSize: '13px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: currentPage === totalPages ? '#9ca3af' : '#374151',
            }}
          >
            Next &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
