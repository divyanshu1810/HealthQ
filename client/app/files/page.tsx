"use client";
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { FileIcon, AlertCircle, Calendar, FileText, Download, Upload, X, Loader2, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Define types
interface FileData {
  _id: string;
  documentId: string;
  s3Url: string;
  fileKey?: string;
  filename: string;
  uploadDate: string;
  fileSize: number;
  mimeType: string;
  extractedData?: {
    openaiFileId?: string;
    assistantId?: string;
    threadId?: string;
  };
}

interface ApiResponse {
  report: FileData[];
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [activeFileMenu, setActiveFileMenu] = useState<string | null>(null);
  const [fileToEdit, setFileToEdit] = useState<FileData | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/auth');
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/files`, {
        headers: { "authorization": token! }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      setFiles(data.report);
      setError(null);
    } catch (err) {
      setError('Failed to fetch files. Please try again later.');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format file size for display
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  // Filter files based on search term
  const filteredFiles = files.filter(file => 
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.documentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle file selection for upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", "authorization": token },
      });
      alert("File uploaded successfully");
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Refresh file list after successful upload
      fetchFiles();
    } catch (error) {
      console.error("Upload error", error);
      alert("Failed to upload file");
    } finally {
      setUploadLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (file: FileData) => {
    setFileToEdit(file);
    setNewFileName(file.filename);
    setIsEditModalOpen(true);
    setActiveFileMenu(null);
  };

  // Open delete modal
  const openDeleteModal = (file: FileData) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
    setActiveFileMenu(null);
  };

  // Handle edit file
  const handleEditFile = async () => {
    if (!fileToEdit || !newFileName.trim()) {
      alert("Please enter a valid file name");
      return;
    }

    setEditLoading(true);
    try {
      const response = await axios.put(`http://localhost:5000/files/${fileToEdit.documentId}`, 
        { fileName: newFileName },
        { headers: { "authorization": token } }
      );
      
      console.log("Edit response:", response.data);
      
      if (response.data.success) {
        alert("File name updated successfully");
        setIsEditModalOpen(false);
        setFileToEdit(null);
        setNewFileName('');
        // Refresh file list after successful update
        fetchFiles();
      } else {
        throw new Error(response.data.message || "Failed to update file name");
      }
    } catch (error) {
      console.error("Edit error:", error);
      alert("Failed to update file name");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete file
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await axios.delete(`http://localhost:5000/files/${fileToDelete.documentId}`, 
        { headers: { "authorization": token } }
      );
      
      console.log("Delete response:", response.data);
      
      if (response.data.success) {
        alert("File deleted successfully");
        setIsDeleteModalOpen(false);
        setFileToDelete(null);
        // Refresh file list after successful deletion
        fetchFiles();
      } else {
        throw new Error(response.data.message || "Failed to delete file");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle file menu
  const toggleFileMenu = (fileId: string) => {
    if (activeFileMenu === fileId) {
      setActiveFileMenu(null);
    } else {
      setActiveFileMenu(fileId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>File Viewer - HealthQ</title>
        <meta name="description" content="View your uploaded files" />
      </Head>

      <header className="bg-black text-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <FileText className="mr-2" size={24} />
              <h1 className="text-xl font-bold">HealthQ</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2 sm:space-x-4 justify-center w-full sm:w-auto">
                <span className="text-sm hidden sm:inline">{files.length} files found</span>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white w-full sm:w-auto"
                >
                  <Upload size={16} className="mr-1 sm:mr-2" />
                  Upload
                </button>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/');
                }}
                className="inline-flex bg-red-700 text-white items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white w-full sm:w-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and filter */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search files by name or ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              {searchTerm && filteredFiles.length > 0 ? `${filteredFiles.length} results` : ''}
            </span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded shadow-md">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-3" size={24} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredFiles.length === 0 && (
          <div className="text-center py-12">
            {searchTerm ? (
              <p className="text-gray-500">No files found matching "{searchTerm}"</p>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">No files found. Upload some files to get started.</p>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none"
                >
                  <Upload size={16} className="mr-2" />
                  Upload File
                </button>
              </div>
            )}
          </div>
        )}

        {/* Files grid */}
        {!loading && !error && filteredFiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredFiles.map((file) => (
              <div key={file._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="p-3 sm:p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="mr-2 sm:mr-3 p-1 sm:p-2 bg-gray-100 rounded-md">
                        <FileIcon className="text-gray-500" size={20} />
                      </div>
                      <div className="overflow-hidden max-w-[150px] sm:max-w-full">
                        <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base" title={file.filename}>
                          {file.filename}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate" title={file.documentId}>
                          ID: {file.documentId.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => toggleFileMenu(file._id)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {/* Dropdown menu */}
                      {activeFileMenu === file._id && (
                        <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => openEditModal(file)}
                              className="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit size={14} className="inline mr-1 sm:mr-2" />
                              Rename File
                            </button>
                            <button
                              onClick={() => openDeleteModal(file)}
                              className="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash2 size={14} className="inline mr-1 sm:mr-2" />
                              Delete File
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap items-center text-sm text-gray-500 mb-3">
                    <Calendar size={16} className="mr-1" />
                    <span className="text-xs sm:text-sm truncate">Uploaded: {formatDate(file.uploadDate)}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <span className="mr-1 sm:mr-2">Type:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        file.mimeType.includes('pdf') ? 'bg-red-50 text-red-700' : 
                        file.mimeType.includes('image') ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {file.mimeType.split('/')[1]?.toUpperCase() || file.mimeType}
                      </span>
                    </div>
                  </div>
                  
                  {file.extractedData && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                        Data Extracted
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row justify-between mt-4 pt-4 border-t border-gray-100 gap-2">
                    <a 
                      href={file.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none w-full sm:w-auto"
                    >
                      <Download size={16} className="mr-1 sm:mr-2" />
                      Download
                    </a>
                    
                    <button 
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none w-full sm:w-auto"
                      onClick={() => router.push('/chat?documentId=' + file.documentId)}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => !uploadLoading && setIsUploadModalOpen(false)}
            ></div>

            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all mx-4 sm:mx-0 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start">
                  <div className="mt-0 text-center sm:mt-0 sm:ml-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Upload Document
                      </h3>
                      <button 
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => !uploadLoading && setIsUploadModalOpen(false)}
                        disabled={uploadLoading}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Select a file to upload to the HealthQ system.
                      </p>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="file-upload" className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-500 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-gray-50">
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="font-medium text-gray-600">
                            {selectedFile ? selectedFile.name : "Select a file"}
                          </span>
                          {!selectedFile && (
                            <span className="text-xs text-gray-500 mt-1">PDF supported</span>
                          )}
                          {selectedFile && (
                            <span className="text-xs text-gray-500 mt-1">
                              {formatFileSize(selectedFile.size)}
                            </span>
                          )}
                          <input 
                            id="file-upload" 
                            type="file" 
                            className="hidden" 
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            disabled={uploadLoading}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    uploadLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadLoading}
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                    uploadLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploadLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && fileToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => !editLoading && setIsEditModalOpen(false)}
            ></div>

            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all mx-4 sm:mx-0 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start">
                  <div className="mt-0 text-center sm:mt-0 sm:ml-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Rename File
                      </h3>
                      <button 
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => !editLoading && setIsEditModalOpen(false)}
                        disabled={editLoading}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Enter a new name for the file.
                      </p>
                      <div className="mb-4">
                        <label htmlFor="new-filename" className="block text-sm font-medium text-gray-700 mb-1">
                          File Name
                        </label>
                        <input
                          type="text"
                          id="new-filename"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          disabled={editLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    editLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  onClick={handleEditFile}
                  disabled={!newFileName.trim() || editLoading}
                >
                  {editLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                    editLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && fileToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => !deleteLoading && setIsDeleteModalOpen(false)}
            ></div>

            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all mx-4 sm:mx-0 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 mb-4 sm:mb-0">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-0 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete File
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the file "{fileToDelete.filename}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    deleteLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  onClick={handleDeleteFile}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                    deleteLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}