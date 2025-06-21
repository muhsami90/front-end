// src/components/chat/ContactList.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Typography, Badge, CircularProgress, TextField, IconButton, InputAdornment, FormControl, Select, MenuItem, SelectChangeEvent, Checkbox, Pagination } from '@mui/material';
import PlatformAvatar from '@/components/ui/PlatformAvatar';
import { Contact } from '@/lib/api';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import BulkActionsToolbar from './BulkActionsToolbar';

// ... (interface and props remain the same)
interface ContactListProps {
  contacts: Contact[];
  isLoading: boolean;
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
  onUpdateName: (params: { contactId: string, newName: string }) => void;
  onToggleAi: (params: { contactId: string, newStatus: boolean }) => void;
  selectedIds: Set<string>;
  onSelectionChange: (id:string) => void;
  onSelectAll: (ids: string[]) => void;
  onDeselectVisible: (ids: string[]) => void;
  onDeselectAll: () => void;
  onBulkUpdate: (status: 'read' | 'unread') => void;
  onBulkDelete: () => void;
}

const ROWS_PER_PAGE = 50;
type PlatformFilter = 'all' | 'whatsapp' | 'facebook' | 'instagram';

// --- STYLES DEFINED HERE ---
// Style for unread contacts (the new "card" look)
const unreadListItemStyle = {
  mb: 1,
  bgcolor: 'background.default',
  borderRadius: 2,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  transition: 'box-shadow 0.3s cubic-bezier(.25,.8,.25,1)',
  '&:hover': {
    boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
  },
};

// Style for read contacts (the original flat look)
const readListItemStyle = {
  // No special styling needed, but we can keep a small margin for consistency
  mb: 0.5,
};


const ContactList: React.FC<ContactListProps> = ({
  contacts, isLoading, selectedContactId, onSelectContact, onUpdateName, onToggleAi,
  selectedIds, onSelectionChange, onSelectAll, onDeselectVisible, onDeselectAll, onBulkUpdate, onBulkDelete,
}) => {
  // ... (all state and handler logic remains exactly the same)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [page, setPage] = useState(1);

  const handlePlatformChange = (event: SelectChangeEvent) => {
    setPlatformFilter(event.target.value as PlatformFilter);
  };

  useEffect(() => { setPage(1); }, [searchTerm, platformFilter]);

  const displayedContacts = useMemo(() => {
    const searched = contacts.filter(c => 
      (!searchTerm) ||
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.platform_user_id.includes(searchTerm)
    );
    if (platformFilter === 'all') return searched;
    return searched.filter(c => c.platform === platformFilter);
  }, [contacts, searchTerm, platformFilter]);

  const paginatedContacts = useMemo(() => {
    const startIndex = (page - 1) * ROWS_PER_PAGE;
    return displayedContacts.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [displayedContacts, page]);
  
  const pageCount = Math.ceil(displayedContacts.length / ROWS_PER_PAGE);
  const numSelectedOnPage = useMemo(() => paginatedContacts.filter(c => selectedIds.has(c.id)).length, [paginatedContacts, selectedIds]);
  const numVisibleOnPage = paginatedContacts.length;

  const handleEditClick = (e: React.MouseEvent, contact: Contact) => { e.stopPropagation(); setEditingId(contact.id); setEditingName(contact.name || ''); };
  const handleSaveName = (contactId: string) => { onUpdateName({ contactId, newName: editingName }); setEditingId(null); };

  const handleSelectAllOnPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const visibleIds = paginatedContacts.map(c => c.id);
    if (event.target.checked) { onSelectAll(visibleIds); } 
    else { onDeselectVisible(visibleIds); }
  };

  const handleListItemClick = (contactId: string) => {
    if (selectedIds.size > 0) { onSelectionChange(contactId); } 
    else { onSelectContact(contactId); }
  };

  return (
    <Box sx={{ width: 320, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', position: 'relative' }}>
      {/* Header and Filter sections remain the same */}
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        {selectedIds.size > 0 ? (
          <BulkActionsToolbar numSelected={selectedIds.size} onMarkAsRead={() => onBulkUpdate('read')} onMarkAsUnread={() => onBulkUpdate('unread')} onDelete={onBulkDelete} onClearSelection={onDeselectAll} />
        ) : (
          <Box><Typography variant="h6" sx={{ mb: 1, px: 1 }}>Contacts</Typography><TextField fullWidth variant="outlined" size="small" placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: ( <InputAdornment position="start"><SearchIcon /></InputAdornment>),}}/></Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, backgroundColor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Checkbox color="primary" indeterminate={numSelectedOnPage > 0 && numSelectedOnPage < numVisibleOnPage} checked={numVisibleOnPage > 0 && numSelectedOnPage === numVisibleOnPage} onChange={handleSelectAllOnPage} />
        <Typography variant="caption" sx={{ flexGrow: 1, mr: 1 }}>Select Page</Typography>
        <FormControl variant="standard" sx={{ minWidth: 120 }} size="small">
          <Select value={platformFilter} onChange={handlePlatformChange} displayEmpty>
            <MenuItem value="all">All Platforms</MenuItem><MenuItem value="whatsapp">WhatsApp</MenuItem><MenuItem value="facebook">Facebook</MenuItem><MenuItem value="instagram">Instagram</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ overflowY: 'auto', flexGrow: 1, position: 'relative' }}>
        {isLoading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%', mt: -2, ml: -2, zIndex: 10 }} />}
        <List sx={{ p: 1, opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {paginatedContacts.map((contact) => (
            <ListItem 
              key={contact.id} 
              disablePadding 
              // --- CONDITIONAL STYLING APPLIED HERE ---
              sx={contact.unread_count > 0 ? unreadListItemStyle : readListItemStyle}
              secondaryAction={<IconButton edge="end" sx={{ mr: 1 }} onClick={() => onToggleAi({ contactId: contact.id, newStatus: !contact.ai_enabled })}>{contact.ai_enabled ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="action" />}</IconButton>}
            >
              <ListItemButton 
                role={undefined} 
                onClick={() => handleListItemClick(contact.id)} 
                dense 
                selected={selectedIds.has(contact.id) || (selectedContactId === contact.id && selectedIds.size === 0)}
                sx={{ borderRadius: 2 }}
              >
                <Checkbox edge="start" checked={selectedIds.has(contact.id)} tabIndex={-1} disableRipple onClick={(e) => { e.stopPropagation(); onSelectionChange(contact.id); }} />
                <ListItemAvatar><Badge badgeContent={contact.unread_count} color="error"><PlatformAvatar platform={contact.platform} /></Badge></ListItemAvatar>
                {editingId === contact.id ? (
                  <TextField variant="standard" size="small" value={editingName} onChange={(e) => setEditingName(e.target.value)} onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(contact.id); else if (e.key === 'Escape') setEditingId(null); }}
                    InputProps={{ endAdornment: (<IconButton size="small" onClick={(e) => { e.stopPropagation(); handleSaveName(contact.id); }}><CheckIcon fontSize="small" /></IconButton>)}}
                    autoFocus
                  />
                ) : (
                  <ListItemText
                    primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography noWrap>{contact.name || contact.platform_user_id}</Typography><IconButton size="small" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }} onClick={(e) => handleEditClick(e, contact)}><EditIcon fontSize="small" /></IconButton></Box>}
                    secondary={<Typography noWrap variant="body2" color="text.secondary">{contact.last_message_preview}</Typography>}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Pagination count={pageCount} page={page} onChange={(e, val) => setPage(val)} color="primary" size="small" />
        </Box>
      )}
    </Box>
  );
};

export default ContactList;