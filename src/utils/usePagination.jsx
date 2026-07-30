import { useState, useMemo, useEffect } from 'react';

/**
 * Hook untuk paginasi.
 * @param {Array} data - Array data utuh (yang sudah difilter/disortir)
 * @param {number|string} defaultItemsPerPage - Jumlah item per halaman standar
 */
export function usePagination(data = [], defaultItemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const safeData = Array.isArray(data) ? data : [];
  const numericLimit = itemsPerPage === 'all' ? safeData.length : Number(itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(safeData.length / (numericLimit || 1)));

  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    if (itemsPerPage === 'all') return safeData;
    const startIndex = (safeCurrentPage - 1) * numericLimit;
    return safeData.slice(startIndex, startIndex + numericLimit);
  }, [safeData, safeCurrentPage, itemsPerPage, numericLimit]);

  const handleSetItemsPerPage = (val) => {
    setItemsPerPage(val === 'all' ? 'all' : Number(val));
    setCurrentPage(1);
  };

  return {
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    itemsPerPage,
    setItemsPerPage: handleSetItemsPerPage
  };
}
