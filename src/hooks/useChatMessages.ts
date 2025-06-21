// src/hooks/useChatMessages.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';

export const useChatMessages = (contactId: string | null) => {
  const queryClient = useQueryClient();

  // --- QUERY ---
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<api.Message[]>({
    queryKey: ['messages', contactId],
    queryFn: () => {
      if (!contactId) return Promise.resolve([]);
      // Mark as read when messages are fetched
      api.markChatAsRead(contactId)
        .then(() => queryClient.invalidateQueries({ queryKey: ['contacts'] })); // Refetch contacts to update unread count
      return api.getMessagesForContact(contactId);
    },
    enabled: !!contactId, // Only run the query if a contactId is provided
  });

  // --- MUTATION for sending a message ---
  const sendMessageMutation = useMutation({
    mutationFn: api.sendMessage,
    onSuccess: (newMessage) => {
      // Add the new message to the cache without a full refetch
      queryClient.setQueryData(['messages', contactId], (oldData: api.Message[] | undefined) => {
        return oldData ? [...oldData, newMessage] : [newMessage];
      });
      // Invalidate contacts to update the last message preview
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  // --- REALTIME ---
  useEffect(() => {
    if (!contactId) return;

    const channel = supabase
      .channel(`public-messages-contact-${contactId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `contact_id=eq.${contactId}` },
        (payload) => {
          console.log('New message via realtime:', payload);
          const newMessage = payload.new as api.Message;
          // Add to cache
          queryClient.setQueryData(['messages', contactId], (oldData: api.Message[] | undefined) => {
            // Avoid duplicates
            if (oldData?.find(msg => msg.id === newMessage.id)) return oldData;
            return oldData ? [...oldData, newMessage] : [newMessage];

          });

          // Mark as read if user is viewing this chat
          if (document.hasFocus()) {
            api.markChatAsRead(contactId)
              .then(() => queryClient.invalidateQueries({ queryKey: ['contacts'] }));
          } else {
             queryClient.invalidateQueries({ queryKey: ['contacts'] }); // just update unread count
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId, queryClient]);


  return {
    messages,
    isLoadingMessages,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
  };
};