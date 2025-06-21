// src/hooks/useChatContacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

export const useChatContacts = () => {
  const queryClient = useQueryClient();

  // Query to fetch all contacts
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<api.Contact[]>({
    queryKey: ['contacts'],
    queryFn: api.getContacts,
    // Add some stale time to avoid refetching too often on window focus
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Helper function to invalidate contacts query after a mutation
  const invalidateContacts = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  // --- SINGLE CONTACT MUTATIONS ---

  const { mutate: updateName } = useMutation({
    mutationFn: api.updateContactName,
    onSuccess: invalidateContacts,
  });

  const { mutate: toggleAi } = useMutation({
    mutationFn: api.toggleAiStatus,
    onSuccess: invalidateContacts,
  });

  const { mutate: deleteContact } = useMutation({
    mutationFn: api.deleteContact,
    onSuccess: invalidateContacts,
  });

  // --- NEW BULK ACTION MUTATIONS ---

  const { mutate: bulkUpdateReadStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: api.bulkUpdateReadStatus,
    onSuccess: (data) => {
      console.log('Successfully updated status for:', data.updated_count, 'contacts');
      invalidateContacts();
    },
    onError: (error) => {
      console.error('Failed to bulk update status:', error);
      // Here you could add a toast notification for the user
    },
  });

  const { mutate: bulkDeleteContacts, isPending: isDeletingContacts } = useMutation({
    mutationFn: api.bulkDeleteContacts,
    onSuccess: (data) => {
      console.log('Successfully deleted:', data.deleted_count, 'contacts');
      invalidateContacts();
    },
    onError: (error) => {
      console.error('Failed to bulk delete contacts:', error);
    },
  });

  return {
    // Queries
    contacts,
    isLoadingContacts,

    // Single contact mutations
    updateName,
    toggleAi,
    deleteContact,

    // New Bulk action mutations
    bulkUpdateReadStatus,
    isUpdatingStatus,
    bulkDeleteContacts,
    isDeletingContacts,
  };
};