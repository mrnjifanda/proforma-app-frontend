import { PaginationInfo } from '@/utils/types';
import React from 'react';

interface PaginationProps {
    paginationInfo: PaginationInfo;
    currentPage: number;
    loading: boolean;
    handlePageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ paginationInfo, currentPage, loading, handlePageChange }) => {
    return (
        <>
            {paginationInfo.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="text-sm text-gray-600">
                        Affichage de {((currentPage - 1) * paginationInfo.limit) + 1} à{' '}
                        {Math.min(currentPage * paginationInfo.limit, paginationInfo.total)} sur{' '}
                        {paginationInfo.total} clients
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Premier
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Précédent
                        </button>

                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, paginationInfo.totalPages))].map((_, i) => {
                                let pageNum;
                                if (paginationInfo.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= paginationInfo.totalPages - 2) {
                                    pageNum = paginationInfo.totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={loading}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${currentPage === pageNum
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } disabled:opacity-50`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === paginationInfo.totalPages || loading}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Suivant
                        </button>
                        <button
                            onClick={() => handlePageChange(paginationInfo.totalPages)}
                            disabled={currentPage === paginationInfo.totalPages || loading}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Dernier
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Pagination;