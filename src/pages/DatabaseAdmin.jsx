import { useState, useEffect } from 'react';
import { Database, Trash2, AlertTriangle, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { databaseAdminAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DatabaseAdmin() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await databaseAdminAPI.getAllTables();
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Failed to load database tables');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName, page = 1) => {
    try {
      setLoadingTable(true);
      const response = await databaseAdminAPI.getTableData(tableName, page);
      if (response.data.success) {
        setTableData(response.data.data);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
      toast.error('Failed to load table data');
    } finally {
      setLoadingTable(false);
    }
  };

  const handleSelectTable = (tableName) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    loadTableData(tableName, 1);
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      // Special handling for users table - delete from Firebase too
      if (selectedTable === 'users') {
        const response = await databaseAdminAPI.deleteUser(recordId);
        if (response.data.success) {
          const msg = response.data.deleted_from_firebase 
            ? 'User deleted from database and Firebase'
            : 'User deleted from database (Firebase deletion failed)';
          toast.success(msg);
          loadTableData(selectedTable, currentPage);
          loadTables(); // Refresh counts
        }
      } else {
        const response = await databaseAdminAPI.deleteRecord(selectedTable, recordId);
        if (response.data.success) {
          toast.success('Record deleted successfully');
          loadTableData(selectedTable, currentPage);
          loadTables(); // Refresh counts
        }
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
    setShowDeleteConfirm(null);
  };

  const handleClearTable = async (tableName) => {
    try {
      const response = await databaseAdminAPI.clearTable(tableName);
      if (response.data.success) {
        toast.success(`Cleared ${response.data.deleted_count} records from ${tableName}`);
        if (selectedTable === tableName) {
          loadTableData(tableName, 1);
        }
        loadTables(); // Refresh counts
      }
    } catch (error) {
      console.error('Error clearing table:', error);
      toast.error('Failed to clear table');
    }
    setShowClearConfirm(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= tableData.total_pages) {
      loadTableData(selectedTable, newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            Database Administration
          </h1>
          <p className="text-gray-600 mt-2">View and manage PostgreSQL database tables</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tables List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Tables</h2>
                <button
                  onClick={loadTables}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => handleSelectTable(table.name)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedTable === table.name
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {table.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {table.row_count} rows
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Data */}
          <div className="lg:col-span-3">
            {!selectedTable ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a table to view its data</p>
              </div>
            ) : loadingTable ? (
              <div className="bg-white rounded-xl shadow-sm p-12 flex items-center justify-center">
                <LoadingSpinner size="large" />
              </div>
            ) : tableData ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{selectedTable}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {tableData.total} total records
                    </p>
                    {selectedTable === 'users' && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg w-fit">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-semibold text-orange-700">
                          Deleting users will also remove them from Firebase Authentication
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowClearConfirm(selectedTable)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Table
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableData.columns.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tableData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {tableData.columns.map((col) => (
                            <td key={col} className="px-4 py-3 text-sm text-gray-900">
                              <div className="max-w-xs truncate" title={row[col]}>
                                {row[col] === null ? (
                                  <span className="text-gray-400 italic">null</span>
                                ) : (
                                  row[col]
                                )}
                              </div>
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setShowDeleteConfirm(row.id || row[tableData.columns[0]])}
                              className="text-red-600 hover:text-red-800 transition"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {tableData.total_pages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {tableData.total_pages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === tableData.total_pages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Clear Table Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Clear Table?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete ALL records from <span className="font-semibold">{showClearConfirm}</span>? 
              This action cannot be undone!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleClearTable(showClearConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
              >
                Yes, Clear Table
              </button>
              <button
                onClick={() => setShowClearConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedTable === 'users' ? 'Delete User?' : 'Delete Record?'}
              </h3>
            </div>
            <p className="text-gray-600 mb-2">
              {selectedTable === 'users' 
                ? 'Are you sure you want to delete this user? This will:'
                : 'Are you sure you want to delete this record? This action cannot be undone!'}
            </p>
            {selectedTable === 'users' && (
              <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1 bg-orange-50 p-3 rounded-lg border border-orange-200">
                <li>Remove the user from the database</li>
                <li>Delete their Firebase Authentication account</li>
                <li>This action cannot be undone!</li>
              </ul>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleDeleteRecord(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
