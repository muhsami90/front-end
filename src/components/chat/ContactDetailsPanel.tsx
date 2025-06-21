// src/components/chat/ContactDetailsPanel.tsx
'use client';

import React from 'react';
// FIX: 'Avatar' has been removed from this import line
import { Box, Card, CardContent, Typography, Chip, Divider } from '@mui/material';
import { Contact } from '@/lib/api';
import PlatformAvatar from '@/components/ui/PlatformAvatar';
import moment from 'moment';

interface ContactDetailsPanelProps {
  contact: Contact | null;
}

export default function ContactDetailsPanel({ contact }: ContactDetailsPanelProps) {
  if (!contact) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">No contact selected</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Card raised>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <PlatformAvatar platform={contact.platform} sx={{ width: 64, height: 64 }} />
          <Typography variant="h6" component="div">
            {contact.name || 'Unnamed Contact'}
          </Typography>
          <Chip label={contact.platform} color="primary" size="small" />
        </CardContent>
        <Divider />
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Details</Typography>
          <Box component="dl" sx={{ m: 0 }}>
            <Typography variant="body2" color="text.secondary">Platform ID</Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{contact.platform_user_id}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">AI Enabled</Typography>
            <Typography variant="body1">{contact.ai_enabled ? 'Yes' : 'No'}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">Last Interaction</Typography>
            <Typography variant="body1">
              {moment(contact.last_interaction_at).format('MMMM Do YYYY, h:mm:ss a')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}