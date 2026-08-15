import { useState, useEffect, useCallback } from 'react';
import { getQuestionsAction, updateQuestionAction, deleteQuestionAction, getUploadUrlAction } from '@/app/actions/questions';
import toast from 'react-hot-toast';

export type Question = {
  id: string;
  word: string;
  mnemonic: string;
  definition: string;
};

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Edit state
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState('');

  // Pagination
  const [pageHistory, setPageHistory] = useState<(string | null)[]>([null]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextKey, setNextKey] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (key: string | null, search: string) => {
    setIsLoading(true);
    const res = await getQuestionsAction(key, search);
    if (res.error) {
      toast.error(res.error);
    } else {
      setQuestions(res.data?.items || []);
      setNextKey(res.data?.lastEvaluatedKey || null);
    }
    setIsLoading(false);
  }, []);

  const refresh = useCallback(() => {
    fetchQuestions(pageHistory[currentIndex], activeSearch);
  }, [fetchQuestions, pageHistory, currentIndex, activeSearch]);

  useEffect(() => {
    fetchQuestions(pageHistory[currentIndex], activeSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, activeSearch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== activeSearch) {
        setPageHistory([null]);
        setCurrentIndex(0);
        setActiveSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageHistory([null]);
    setCurrentIndex(0);
    setActiveSearch(searchQuery);
  };

  const handleNext = () => {
    if (nextKey) {
      if (currentIndex === pageHistory.length - 1) {
        setPageHistory(prev => [...prev, nextKey]);
      }
      setCurrentIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const openEdit = (q: Question) => setEditQuestion(q);
  const closeEdit = () => setEditQuestion(null);

  const handleUpdate = async (formData: FormData) => {
    if (!editQuestion) return;
    setIsPending(true);
    const res = await updateQuestionAction(editQuestion.id, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Question updated successfully!');
      closeEdit();
      refresh();
    }
    setIsPending(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsPending(true);
    const res = await deleteQuestionAction(deleteId);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Question deleted successfully!');
      setDeleteId(null);
      refresh();
    }
    setIsPending(false);
  };

  const handleImportSubmit = async (file: File) => {
    setIsPending(true);
    try {
      const ext = file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'csv';
      setUploadingStatus('Requesting upload link...');

      const urlRes = await getUploadUrlAction(ext);
      if (urlRes?.error) throw new Error(urlRes.error);

      setUploadingStatus('Uploading file to S3...');
      const uploadRes = await fetch(urlRes.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file to S3');

      setUploadingStatus('Upload complete! Processing in background...');
      toast.success('File uploaded! Questions will appear shortly.');

      setTimeout(() => {
        setIsImportOpen(false);
        setUploadingStatus('');
        setIsPending(false);
        refresh();
      }, 2000);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred during import');
      setUploadingStatus('');
      setIsPending(false);
    }
  };

  return {
    // Data
    questions, isLoading, nextKey,
    // Search
    searchQuery, setSearchQuery, handleSearchSubmit,
    // Pagination
    currentIndex, handleNext, handlePrev,
    // Refresh
    refresh,
    // Edit
    editQuestion, openEdit, closeEdit, handleUpdate,
    // Delete
    deleteId, setDeleteId, handleDelete,
    // Import
    isImportOpen, setIsImportOpen, uploadingStatus, handleImportSubmit,
    isPending,
  };
}
