import { useState, useEffect, useCallback } from 'react';
import { listAdminsAction, updateAdminAction, deleteAdminAction, AdminUser } from '@/app/actions/admins';
import toast from 'react-hot-toast';


export function useAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

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

  return {
    admins, isLoading, isPending,
    editAdmin, openEdit, closeEdit, handleUpdate,
    deleteId, setDeleteId, handleDelete,
    fetchAdmins,
  };
}
