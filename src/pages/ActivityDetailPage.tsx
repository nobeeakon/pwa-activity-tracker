import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Box,
  Chip,
  Card,
  CardContent,
  TextField,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { differenceInHours, addHours, max } from 'date-fns';
import { useActivity } from '../hooks/useActivity';
import { activityService } from '../db/activityService';
import { MonthCalendar } from '../components/Calendar/MonthCalendar';
import { ActivityForm } from '../components/Activities/ActivityForm';
import { RecordActivityDialog } from '../components/Activities/RecordActivityDialog';
import { statusColors } from '../theme/theme';
import {
  calculateStatus,
  formatTimeDuration,
  formatRecordDate,
  MAX_NOTE_LENGTH
} from '../utils/activityHelpers';
import type { ActivityStatus } from '../types/activity';

export function ActivityDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const activity = useActivity(Number(activityId));

  const [editFormOpen, setEditFormOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [deleteActivityDialogOpen, setDeleteActivityDialogOpen] = useState(false);
  const [deleteRecordDialogOpen, setDeleteRecordDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [editingRecordIndex, setEditingRecordIndex] = useState<number | null>(null);
  const [editedNote, setEditedNote] = useState<string>('');
  const [savingRecordIndex, setSavingRecordIndex] = useState<number | null>(null);

  // Calculate status and timing info
  const { lastRecordedDate, hoursSinceLastRecord, hoursUntilDue, status } = useMemo(() => {
    if (!activity) return { lastRecordedDate: null, hoursSinceLastRecord: null, hoursUntilDue: undefined, status: undefined };

    const dates = activity.records.map(r => r.date);
    const lastDate = dates.length > 0 ? max(dates) : null;
    const hoursSince = lastDate ? differenceInHours(new Date(), lastDate) : null;

    if (!activity.everyHours) {
      return {
        lastRecordedDate: lastDate,
        hoursSinceLastRecord: hoursSince,
        hoursUntilDue: undefined,
        status: undefined
      };
    }

    const nextDue = lastDate ? addHours(lastDate, activity.everyHours) : null;
    const hoursUntil = nextDue ? differenceInHours(nextDue, new Date()) : null;
    const activityStatus = hoursUntil !== null ? calculateStatus(hoursUntil) : undefined;

    return {
      lastRecordedDate: lastDate,
      hoursSinceLastRecord: hoursSince,
      hoursUntilDue: hoursUntil,
      status: activityStatus
    };
  }, [activity]);

  const statusLabels: Record<ActivityStatus, string> = {
    onTrack: 'On Track',
    almostOverdue: 'Almost Overdue',
    shortOverdue: 'Overdue',
    overdue: 'Very Overdue'
  };

  // Sort records newest first
  const sortedRecords = useMemo(() => {
    if (!activity) return [];
    return [...activity.records]
      .map((record, index) => ({ ...record, originalIndex: index }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activity]);

  const handleBack = () => {
    navigate('/');
  };

  const handleDeleteActivity = async () => {
    if (activity?.id) {
      await activityService.deleteActivity(activity.id);
      navigate('/');
    }
  };

  const handleDeleteRecord = async () => {
    if (activity?.id && recordToDelete !== null) {
      await activityService.deleteRecord(activity.id, recordToDelete);
      setRecordToDelete(null);
      setDeleteRecordDialogOpen(false);
    }
  };

  const handleEditRecord = (index: number, currentNote?: string) => {
    setEditingRecordIndex(index);
    setEditedNote(currentNote || '');
  };

  const handleSaveRecord = async (index: number) => {
    if (activity?.id) {
      setSavingRecordIndex(index);
      await activityService.updateRecordNote(activity.id, index, editedNote || undefined);
      setSavingRecordIndex(null);
      setEditingRecordIndex(null);
      setEditedNote('');
    }
  };

  const handleCancelEdit = () => {
    setEditingRecordIndex(null);
    setEditedNote('');
  };

  const openDeleteRecordDialog = (index: number) => {
    setRecordToDelete(index);
    setDeleteRecordDialogOpen(true);
  };

  // Loading or not found
  if (!activity) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Activity not found or loading...</Typography>
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {activity.name}
          </Typography>
          <IconButton color="inherit" onClick={() => setEditFormOpen(true)}>
            <EditIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => setDeleteActivityDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Activity Header */}
        <Box sx={{ mb: 3 }}>
          {activity.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {activity.description}
            </Typography>
          )}

          {activity.everyHours !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {status && (
                <Chip
                  label={statusLabels[status]}
                  size="small"
                  sx={{
                    backgroundColor: statusColors[status],
                    color: 'white'
                  }}
                />
              )}
              <Typography variant="caption" color="text.secondary">
                Every {formatTimeDuration(activity.everyHours)}
              </Typography>
            </Box>
          )}

          {lastRecordedDate ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Last done: {formatTimeDuration(hoursSinceLastRecord!)} ago
              </Typography>
              {hoursUntilDue !== undefined && hoursUntilDue !== null && (
                <Typography variant="body2" color="text.secondary">
                  {hoursUntilDue > 0
                    ? `Next due: in ${formatTimeDuration(hoursUntilDue)}`
                    : `Overdue by: ${formatTimeDuration(-hoursUntilDue)}`
                  }
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No records yet
            </Typography>
          )}
        </Box>

        {/* Calendar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Calendar
          </Typography>
          <MonthCalendar records={activity.records} />
        </Box>

        {/* Records List */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Records ({activity.records.length})
          </Typography>
          {sortedRecords.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No records yet. Add your first record using the button below.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sortedRecords.map((record) => (
                <Card key={record.originalIndex} variant="outlined">
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2
                    }}>
                      <Box sx={{ flex: 1, width: '100%' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {formatRecordDate(record.date)}
                        </Typography>
                        {editingRecordIndex === record.originalIndex ? (
                          <Box sx={{ mt: 1 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              value={editedNote}
                              onChange={(e) => {
                                if (e.target.value.length <= MAX_NOTE_LENGTH) {
                                  setEditedNote(e.target.value);
                                }
                              }}
                              placeholder="Add a note..."
                              helperText={`${editedNote.length}/${MAX_NOTE_LENGTH} characters`}
                              disabled={savingRecordIndex === record.originalIndex}
                            />
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={() => handleSaveRecord(record.originalIndex)}
                                disabled={savingRecordIndex === record.originalIndex}
                              >
                                Save
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CloseIcon />}
                                onClick={handleCancelEdit}
                                disabled={savingRecordIndex === record.originalIndex}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body1">
                            {record.note || <em style={{ color: '#999' }}>No note</em>}
                          </Typography>
                        )}
                      </Box>
                      {editingRecordIndex !== record.originalIndex && (
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1,
                          flexDirection: { xs: 'row', sm: 'column' },
                          width: { xs: '100%', sm: 'auto' }
                        }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditRecord(record.originalIndex, record.note)}
                            sx={{ flex: { xs: 1, sm: 'none' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteRecordDialog(record.originalIndex)}
                            sx={{ flex: { xs: 1, sm: 'none' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Container>

      {/* FAB for adding new record */}
      <Fab
        color="primary"
        aria-label="add record"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16
        }}
        onClick={() => setRecordDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Edit Activity Dialog */}
      {editFormOpen && (
        <ActivityForm
          open={editFormOpen}
          onClose={() => setEditFormOpen(false)}
          activity={activity}
        />
      )}

      {/* Record Activity Dialog */}
      {recordDialogOpen && (
        <RecordActivityDialog
          open={recordDialogOpen}
          onClose={() => setRecordDialogOpen(false)}
          activity={activity}
        />
      )}

      {/* Delete Activity Confirmation Dialog */}
      <Dialog open={deleteActivityDialogOpen} onClose={() => setDeleteActivityDialogOpen(false)}>
        <DialogTitle>Delete Activity</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{activity.name}"? This action cannot be undone and will delete all records.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteActivityDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteActivity} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Record Confirmation Dialog */}
      <Dialog open={deleteRecordDialogOpen} onClose={() => setDeleteRecordDialogOpen(false)}>
        <DialogTitle>Delete Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this record? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRecordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRecord} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
