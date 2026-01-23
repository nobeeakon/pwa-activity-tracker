import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Box,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import { useTags, useTagUsageCounts } from '../../hooks/useTags';
import { tagService } from '../../db/tagService';
import type { Tag } from '../../types/tag';

type TagManagerProps = {
  open: boolean;
  onClose: () => void;
};

// Default color presets (matching theme colors)
const DEFAULT_TAG_COLORS = [
  '#1976d2', // Blue (theme primary)
  '#4caf50', // Green
  '#ff9800', // Orange
  '#f44336', // Red
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#607d8b'  // Blue Grey
];

export function TagManager({ open, onClose }: TagManagerProps) {
  const tags = useTags();
  const tagUsageCounts = useTagUsageCounts();

  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TAG_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogTag, setDeleteDialogTag] = useState<Tag | null>(null);

  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id!);
    setEditName(tag.name);
    setEditColor(tag.color);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditName('');
    setEditColor('');
    setError(null);
  };

  const handleSaveEdit = async (tagId: number) => {
    try {
      await tagService.updateTag(tagId, {
        name: editName,
        color: editColor
      });
      setEditingTagId(null);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAddNew = async () => {
    if (!newTagName.trim()) {
      setError('Tag name cannot be empty');
      return;
    }

    try {
      await tagService.addTag({
        name: newTagName,
        color: newTagColor,
        createdAt: new Date()
      });
      setNewTagName('');
      setNewTagColor(DEFAULT_TAG_COLORS[0]);
      setIsAddingNew(false);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialogTag?.id) return;

    try {
      await tagService.deleteTag(deleteDialogTag.id);
      setDeleteDialogTag(null);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setDeleteDialogTag(null);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell width={100}>Color</TableCell>
                  <TableCell width={80}>Usage</TableCell>
                  <TableCell width={120}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tags.map(tag => {
                  const isEditing = editingTagId === tag.id;
                  const usageCount = tagUsageCounts.get(tag.id!) || 0;
                  const canDelete = usageCount === 0;

                  return (
                    <TableRow key={tag.id}>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            size="small"
                            fullWidth
                            autoFocus
                          />
                        ) : (
                          tag.name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              type="color"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              size="small"
                              sx={{ width: 60 }}
                            />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              width: 40,
                              height: 24,
                              backgroundColor: tag.color,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {usageCount} {usageCount === 1 ? 'activity' : 'activities'}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveEdit(tag.id!)}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleStartEdit(tag)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <Tooltip
                              title={
                                canDelete
                                  ? 'Delete tag'
                                  : `Cannot delete: used by ${usageCount} ${usageCount === 1 ? 'activity' : 'activities'}`
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={!canDelete}
                                  onClick={() => setDeleteDialogTag(tag)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Add New Row */}
                {isAddingNew ? (
                  <TableRow>
                    <TableCell>
                      <TextField
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="New tag name"
                        size="small"
                        fullWidth
                        autoFocus
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        size="small"
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={handleAddNew}
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setIsAddingNew(false);
                            setNewTagName('');
                            setNewTagColor(DEFAULT_TAG_COLORS[0]);
                            setError(null);
                          }}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>

          {!isAddingNew && (
            <Box sx={{ mt: 2 }}>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={() => setIsAddingNew(true)}
              >
                Add New Tag
              </Button>
            </Box>
          )}

          {tags.length === 0 && !isAddingNew && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No tags yet. Click "Add New Tag" to create your first tag.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogTag !== null} onClose={() => setDeleteDialogTag(null)}>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the tag "{deleteDialogTag?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogTag(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
