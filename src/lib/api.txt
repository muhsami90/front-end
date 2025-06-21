// src/lib/api.ts
import { supabase } from './supabaseClient';

// Define types for our data for type safety
export interface Contact {
  id: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  platform_user_id: string;
  name: string;
  avatar_url: string | null;
  ai_enabled: boolean;
  last_interaction_at: string;
  last_message_preview: string;
  unread_count: number;
}

export interface Message {
  id: string;
  contact_id: string;
  sender_type: 'user' | 'agent' | 'ai';
  content_type: 'text' | 'image' | 'audio';
  text_content: string | null;
  attachment_url: string | null;
  sent_at: string;
}

// --- API Functions ---

export const getContacts = async (): Promise<Contact[]> => {
  const { data, error } = await supabase.functions.invoke('get-contacts');
  if (error) throw new Error(error.message);
  return data || [];
};

export const getMessagesForContact = async (contactId: string): Promise<Message[]> => {
  const { data, error } = await supabase.functions.invoke('get-messages-for-contact', {
    body: { contact_id: contactId },
  });
  if (error) throw new Error(error.message);
  return data || [];
};

export const markChatAsRead = async (contactId: string) => {
    const { error } = await supabase.functions.invoke('mark-chat-as-read', {
        body: { contact_id: contactId }
    });
    if (error) throw new Error(error.message);
    return { success: true };
}

export const updateContactName = async ({ contactId, newName }: { contactId: string, newName: string }) => {
    const { data, error } = await supabase.functions.invoke('update-contact-name', {
        body: { contact_id: contactId, new_name: newName }
    });
    if (error) throw new Error(error.message);
    return data;
}

export const toggleAiStatus = async ({ contactId, newStatus }: { contactId: string, newStatus: boolean }) => {
    const { error } = await supabase.from('contacts').update({ ai_enabled: newStatus }).eq('id', contactId);
    if (error) throw new Error(error.message);
    return { success: true };
}

export const deleteContact = async (contactId: string) => {
    const { data, error } = await supabase.functions.invoke('delete-contact-and-messages', {
        body: { contact_id: contactId }
    });
    if (error) throw new Error(error.message);
    return data;
}

export const sendMessage = async (payload: { contact_id: string; content_type: string; text_content?: string; attachment_url?: string; platform: string }) => {
    const { platform, ...messagePayload } = payload;
    let edgeFunctionName = '';

    if (platform === 'facebook') edgeFunctionName = 'send-facebook-agent-message';
    else if (platform === 'whatsapp') edgeFunctionName = 'send-agent-whatsapp-message';
    else throw new Error(`Unsupported platform for sending agent message: ${platform}`);
    
    const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: messagePayload
    });
    if (error) throw new Error(error.message);
    return data.message;
}