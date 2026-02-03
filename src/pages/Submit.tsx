import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link2, FileText, AlertCircle, CheckCircle2, X, FileUp, ExternalLink, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { submissionsAPI } from '../lib/api';

export default function Submit() {
  const { isTeam, teamId, teamName } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [externalLink, setExternalLink] = useState('');
  const [originalFilename, setOriginalFilename] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isTeam) {
    navigate('/team-login');
    return null;
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF, JPEG, or PNG.');
      return;
    }
    
    if (selectedFile.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }
    
    setFile(selectedFile);
    setOriginalFilename(selectedFile.name);
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateFilename = (filename: string) => {
    const expectedPattern = new RegExp(
      `^${teamName?.replace(/\s+/g, '')}_[A-Za-z0-9]+_DeExtinction_(Primary|Secondary)\\.(pdf|pptx?|png|jpg|jpeg)$`,
      'i'
    );
    return expectedPattern.test(filename);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!teamId) {
      setError('Team not identified');
      return;
    }

    // Validate filename format
    if (!validateFilename(originalFilename)) {
      setError(`Filename must follow format: TEAMNAME_SCHOOLNAME_DeExtinction_YearCategory.ext\nExample: ${teamName?.replace(/\s+/g, '')}_ACS_DeExtinction_Secondary.pdf`);
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'file' && file) {
        await submissionsAPI.uploadFile(Number(teamId), file, originalFilename);
      } else if (activeTab === 'link' && externalLink) {
        await submissionsAPI.submitLink(Number(teamId), externalLink, originalFilename);
      } else {
        throw new Error('Please provide a file or link');
      }

      setSuccess('Submission successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/team-dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setOriginalFilename('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-6">
          <h1 className="text-2xl font-bold font-heading text-white flex items-center gap-3">
            <Upload className="w-7 h-7 text-[#14FFEC]" />
            Submit Poster
          </h1>
          <p className="text-slate-400 mt-2">
            Upload your research poster for the De-extinction competition
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              setActiveTab('file');
              setError('');
            }}
            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'file'
                ? 'text-[#0D7377] border-b-2 border-[#0D7377] bg-[#0D7377]/5'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileUp className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={() => {
              setActiveTab('link');
              setError('');
              clearFile();
            }}
            className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'link'
                ? 'text-[#0D7377] border-b-2 border-[#0D7377] bg-[#0D7377]/5'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Link2 className="w-4 h-4" />
            External Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Filename Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Required Filename Format:</p>
                <code className="block bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded mt-1 font-mono text-xs">
                  TEAMNAME_SCHOOLNAME_DeExtinction_YearCategory.ext
                </code>
                <p className="mt-2 text-xs">
                  Example: <span className="font-mono">{teamName?.replace(/\s+/g, '')}_ACS_DeExtinction_Secondary.pdf</span>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 dark:text-red-400 text-sm whitespace-pre-line">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}

          {activeTab === 'file' ? (
            <div className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#0D7377] bg-[#0D7377]/5'
                    : file
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-slate-300 dark:border-slate-600 hover:border-[#0D7377]/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.pptx,.ppt,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Drop your poster here or click to browse
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      PDF, PPTX, PPT, JPEG, or PNG up to 50MB
                    </p>
                  </>
                )}
              </div>

              {/* Original Filename Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Filename (as shown on poster)
                </label>
                <input
                  type="text"
                  value={originalFilename}
                  onChange={(e) => setOriginalFilename(e.target.value)}
                  placeholder="TeamName_SchoolName_DeExtinction_Secondary.pdf"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  External Link (Canva, Google Drive, etc.)
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Make sure the link is accessible to anyone with the link
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Poster Filename
                </label>
                <input
                  type="text"
                  value={originalFilename}
                  onChange={(e) => setOriginalFilename(e.target.value)}
                  placeholder="TeamName_SchoolName_DeExtinction_Secondary.pdf"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium mb-1">Link Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Google Drive: Set to "Anyone with link can view"</li>
                      <li>Canva: Enable "Share" → "Anyone with link"</li>
                      <li>Ensure the poster is clearly visible without login</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (activeTab === 'file' && !file) || (activeTab === 'link' && !externalLink) || !originalFilename}
            className="w-full py-3 bg-[#0D7377] text-white rounded-lg font-medium hover:bg-[#0A5A5D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Submit Poster
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
