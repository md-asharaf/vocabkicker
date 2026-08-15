import { useState, useEffect, useCallback, useMemo } from 'react';
import { listAdminsAction, updateAdminAction, deleteAdminAction, AdminUser } from '@/app/actions/admins';
import { registerAction } from '@/app/actions/auth';
import toast from 'react-hot-toast';

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const [isCreating, setIsCreating] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    const res = await listAdminsAction();
    if (res.error) {
      toast.error(res.error);
    } else {
      setAdmins(res.admins || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const openCreate = () => setIsCreating(true);
  const closeCreate = () => setIsCreating(false);

  const handleCreate = async (formData: FormData) => {
    setIsPending(true);
    const res = await registerAction(formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Admin created successfully!');
      closeCreate();
      fetchAdmins();
    }
    setIsPending(false);
  };

  const openEdit = (admin: AdminUser) => setEditAdmin(admin);
  const closeEdit = () => setEditAdmin(null);

  const handleUpdate = async (formData: FormData) => {
    if (!editAdmin) return;
    setIsPending(true);
    const res = await updateAdminAction(editAdmin.id, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Admin updated successfully!');
      closeEdit();
      fetchAdmins();
    }
    setIsPending(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsPending(true);
    const res = await deleteAdminAction(deleteId);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Admin deleted successfully!');
      setDeleteId(null);
      fetchAdmins();
    }
    setIsPending(false);
  };

  const filteredAdmins = useMemo(() => {
    if (!debouncedSearch) return admins;
    const lower = debouncedSearch.toLowerCase();
    return admins.filter(a => a.email.toLowerCase().includes(lower) || a.id.toLowerCase().includes(lower));
  }, [admins, debouncedSearch]);

  return {
    admins: filteredAdmins, isLoading, isPending,
    search, setSearch,
    isCreating, openCreate, closeCreate, handleCreate,
    editAdmin, openEdit, closeEdit, handleUpdate,
    deleteId, setDeleteId, handleDelete,
    fetchAdmins,
  };
}
