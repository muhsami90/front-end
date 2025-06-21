// src/components/chat/BulkActionsToolbar.tsx
import React from 'react';
import { Toolbar, Typography, Box, Tooltip, IconButton } from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import CloseIcon from '@mui/icons-material/Close';

interface BulkActionsToolbarProps {
  numSelected: number;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  numSelected,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onClearSelection,
}) => {
  return (
    <Toolbar
      variant="dense"
      sx={{
        pl: 1, // Padding left
        pr: 1, // Padding right
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: 1,
      }}
    >
      {/* Left side: Close icon and selection count */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={onClearSelection} color="inherit">
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" component="span" sx={{ ml: 2 }}>
          {numSelected}
        </Typography>
      </Box>

      {/* Spacer to push actions to the right */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Right side: Action Icons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Mark as Read">
          <IconButton onClick={onMarkAsRead} color="inherit">
            <MarkEmailReadOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Mark as Unread">
          <IconButton onClick={onMarkAsUnread} color="inherit">
            <MarkEmailUnreadOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Selected">
          <IconButton 
            onClick={onDelete} 
            size="small"
            sx={{ 
                bgcolor: 'error.main', 
                color: 'white',
                '&:hover': {
                    bgcolor: 'error.dark'
                }
            }}
          >
            <DeleteForeverOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Toolbar>
  );
};

export default BulkActionsToolbar;