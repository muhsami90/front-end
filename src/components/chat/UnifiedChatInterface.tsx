// src/components/chat/UnifiedChatInterface.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ContactList from './ContactList';
import ChatArea from './ChatArea';
import AdminPanel from './AdminPanel';
import { useChatContacts } from '@/hooks/useChatContacts';
import { useChatMessages } from '@/hooks/useChatMessages';
import { supabase } from '@/lib/supabaseClient'; // This will now be used by handleBackup

interface UnifiedChatInterfaceProps {
  isAdminPanelOpen: boolean;
}

export default function UnifiedChatInterface({ isAdminPanelOpen }: UnifiedChatInterfaceProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  const { 
    contacts, isLoadingContacts, updateName, toggleAi, deleteContact,
    bulkUpdateReadStatus, isUpdatingStatus, bulkDeleteContacts, isDeletingContacts
  } = useChatContacts();

  const { 
    messages, isLoadingMessages, sendMessage, isSendingMessage
  } = useChatMessages(selectedContactId);
  
  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId);
  }, [contacts, selectedContactId]);

  // --- Bulk Action Handlers ---

  const handleSelectionChange = (contactId: string) => {
    setSelectedContactIds(prev => {
      const newSelection = new Set(prev);
      // FIX: Changed ternary operator to a standard if/else statement
      if (newSelection.has(contactId)) {
        newSelection.delete(contactId);
      } else {
        newSelection.add(contactId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (contactIdsToSelect: string[]) => {
    setSelectedContactIds(prev => new Set([...prev, ...contactIdsToSelect]));
  };
  
  const handleDeselectVisible = (contactIdsToDeselect: string[]) => {
    setSelectedContactIds(prev => {
        const newSelection = new Set(prev);
        contactIdsToDeselect.forEach(id => newSelection.delete(id));
        return newSelection;
    });
  };

  const handleDeselectAll = () => {
    setSelectedContactIds(new Set());
  };

  const handleBulkUpdate = (status: 'read' | 'unread') => {
    if (selectedContactIds.size === 0) return;
    bulkUpdateReadStatus(
      { contactIds: Array.from(selectedContactIds), status },
      { onSuccess: () => setSelectedContactIds(new Set()) }
    );
  };

  const handleBulkDelete = () => {
    if (selectedContactIds.size === 0) return;
    const confirmation = window.confirm(`Are you sure you want to delete ${selectedContactIds.size} contacts and all their messages? This action cannot be undone.`);
    if (!confirmation) return;
    if (selectedContactId && selectedContactIds.has(selectedContactId)) {
        setSelectedContactId(null);
    }
    bulkDeleteContacts(
      Array.from(selectedContactIds),
      { onSuccess: () => setSelectedContactIds(new Set()) }
    );
  };

  // --- Other Handlers ---

  const handleSendMessage = (text: string) => {
    if (!selectedContact) return;
    sendMessage({
        contact_id: selectedContact.id, content_type: 'text', text_content: text, platform: selectedContact.platform,
    });
  }

  const handleSendImageByUrl = (url: string) => {
    if (!selectedContact) return;
    sendMessage({
      contact_id: selectedContact.id, content_type: 'image', attachment_url: url, platform: selectedContact.platform
    });
  }
  
  const handleSingleDelete = (contactId: string) => {
    if (window.confirm("Are you sure you want to delete this contact and all their messages?")) {
        deleteContact(contactId);
        if(selectedContactId === contactId) {
            setSelectedContactId(null);
        }
    }
  }

  // FIX: Restored the full handleBackup function body
  const handleBackup = async (format: 'csv' | 'txt_detailed' | 'txt_numbers_only' | 'txt_number_name' | 'json') => {
    try {
        const { data: whatsappContacts, error } = await supabase.functions.invoke('get-whatsapp-contacts-for-backup');
        if (error) throw error;
        if (!whatsappContacts || whatsappContacts.length === 0) {
            alert('No WhatsApp contacts found to backup.');
            return;
        }

        let fileContentString = "";
        let mimeType = "text/plain";
        let fileExtension = "txt";
        type BackupContact = { name?: string; platform_user_id?: string; [key: string]: unknown };
        const typedWhatsappContacts = whatsappContacts as BackupContact[];

        if (format === 'csv') {
            mimeType = "text/csv"; fileExtension = "csv";
            const csvRows = ["Name,PhoneNumber"];
            typedWhatsappContacts.forEach((contact) => {
                const name = contact.name ? `"${contact.name.replace(/"/g, '""')}"` : 'N/A';
                csvRows.push(`${name},${contact.platform_user_id || 'N/A'}`);
            });
            fileContentString = csvRows.join("\r\n");
        } else if (format === 'txt_numbers_only') {
            fileContentString = typedWhatsappContacts.map((c) => c.platform_user_id).filter(Boolean).join("\r\n");
        } else if (format === 'txt_detailed') {
            const txtLines: string[] = [];
            typedWhatsappContacts.forEach((contact) => {
              txtLines.push(`Name: ${contact.name || 'N/A'}, Phone: ${contact.platform_user_id || 'N/A'}`);
            });
            fileContentString = txtLines.join("\r\n");
        } else if (format === 'txt_number_name') {
            fileContentString = typedWhatsappContacts.map((c) => `${c.platform_user_id || 'No Number'}:${c.name || 'No Name'}`).join("\r\n");
        } else if (format === 'json') {
            mimeType = "application/json"; fileExtension = "json";
            fileContentString = JSON.stringify(typedWhatsappContacts.map((c) => ({ name: c.name || 'N/A', phoneNumber: c.platform_user_id || 'N/A'})), null, 2);
        }
        
        const blob = new Blob([fileContentString], { type: `${mimeType};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
        link.setAttribute("href", url);
        link.setAttribute("download", `whatsapp_contacts_backup_${timestamp}.${fileExtension}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert(`WhatsApp contacts backup download initiated as ${format.toUpperCase()}!`);
    } catch (err: unknown) { 
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) { errorMessage = err.message; }
        else if (typeof err === 'string') { errorMessage = err; }
        alert(`An error occurred during backup: ${errorMessage}`);
    }
  };

  React.useEffect(() => {
    if (selectedContactId && !contacts.find(c => c.id === selectedContactId)) {
        setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);
  
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Box sx={{ width: isSidebarOpen ? 320 : 0, overflow: 'hidden', flexShrink: 0, transition: 'width 0.3s ease-in-out', height: '100%' }}>
        <ContactList
          contacts={contacts}
          isLoading={isLoadingContacts || isUpdatingStatus || isDeletingContacts}
          selectedContactId={selectedContactId}
          onSelectContact={setSelectedContactId}
          onUpdateName={updateName}
          onToggleAi={toggleAi}
          selectedIds={selectedContactIds}
          onSelectionChange={handleSelectionChange}
          onSelectAll={handleSelectAll}
          onDeselectVisible={handleDeselectVisible}
          onDeselectAll={handleDeselectAll}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
        />
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
         <Box sx={{ p: 0.5, backgroundColor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Tooltip title={isSidebarOpen ? "Hide Contacts" : "Show Contacts"}>
                <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
            </Tooltip>
        </Box>
        <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          <ChatArea
            contact={selectedContact}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            onSendMessage={handleSendMessage}
            onSendImageByUrl={handleSendImageByUrl}
            isSendingMessage={isSendingMessage}
            onDeleteContact={handleSingleDelete}
          />
        </Box>
      </Box>
      <Box sx={{ width: isAdminPanelOpen ? 320 : 0, overflow: 'hidden', flexShrink: 0, transition: 'width 0.3s ease-in-out', height: '100%' }}>
        <AdminPanel onBackupWhatsappNumbers={handleBackup} />
      </Box>
    </Box>
  );
}