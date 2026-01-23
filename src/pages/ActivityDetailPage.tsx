import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isSameMonth, format } from 'date-fns';
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
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useActivity } from '../hooks/useActivity';
import { activityService } from '../db/activityService';
import { MonthCalendar } from '../components/Calendar/MonthCalendar';
import { ActivityForm } from '../components/Activities/ActivityForm';
import { RecordActivityDialog } from '../components/Activities/RecordActivityDialog';
import { statusColors } from '../theme/theme';
import {
  calculateActivityStatus,
  formatTimeDuration,
  formatRecordDate,
  MAX_NOTE_LENGTH,
  calculatePeriodStatistics
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthRecordsOnly, setShowMonthRecordsOnly] = useState(false);

  // Calculate status and timing info
  const { lastRecordedDate, hoursSinceLastRecord, hoursUntilDue, status } = useMemo(() => {
    if (!activity) return { lastRecordedDate: null, hoursSinceLastRecord: null, hoursUntilDue: null, status: null };
    return calculateActivityStatus(activity);
  }, [activity]);

  const statusLabels: Record<ActivityStatus, string> = {
    onTrack: 'On Track',
    almostOverdue: 'Almost Overdue',
    shortOverdue: 'Overdue',
    overdue: 'Very Overdue'
  };

  // Sort records newest first, optionally filtered by calendar month
  const sortedRecords = useMemo(() => {
    if (!activity) return [];
    let records = [...activity.records]
      .map((record, index) => ({ ...record, originalIndex: index }));

    // Filter by month if enabled
    if (showMonthRecordsOnly) {
      records = records.filter(record => isSameMonth(record.date, currentMonth));
    }

    return records.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activity, showMonthRecordsOnly, currentMonth]);

  // Calculate statistics for different time periods
  const statistics = useMemo(() => {
    if (!activity) return null;
    return calculatePeriodStatistics(activity);
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

        {/* Statistics */}
        {statistics && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Statistics
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Last Month</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Current Month</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>All Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Records Row */}
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Records
                    </TableCell>
                    <TableCell>{statistics.lastMonth.recordCount}</TableCell>
                    <TableCell>{statistics.currentMonth.recordCount}</TableCell>
                    <TableCell>{statistics.allTime.recordCount}</TableCell>
                  </TableRow>

                  {/* Avg. Time Between Row - only show if at least one period has data */}
                  {(statistics.lastMonth.averageTimeBetweenRecords !== null ||
                    statistics.currentMonth.averageTimeBetweenRecords !== null ||
                    statistics.allTime.averageTimeBetweenRecords !== null) && (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Avg. Time Between
                      </TableCell>
                      <TableCell>
                        {statistics.lastMonth.averageTimeBetweenRecords !== null
                          ? formatTimeDuration(statistics.lastMonth.averageTimeBetweenRecords)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {statistics.currentMonth.averageTimeBetweenRecords !== null
                          ? formatTimeDuration(statistics.currentMonth.averageTimeBetweenRecords)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {statistics.allTime.averageTimeBetweenRecords !== null
                          ? formatTimeDuration(statistics.allTime.averageTimeBetweenRecords)
                          : '—'}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* vs. Schedule Row - only show if activity has everyHours */}
                  {activity.everyHours &&
                    (statistics.lastMonth.averageTimeVsScheduled !== null ||
                      statistics.currentMonth.averageTimeVsScheduled !== null ||
                      statistics.allTime.averageTimeVsScheduled !== null) && (
                      <TableRow>
                        <TableCell component="th" scope="row">
                          vs. Schedule
                        </TableCell>
                        <TableCell>
                          {statistics.lastMonth.averageTimeVsScheduled !== null ? (
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  statistics.lastMonth.averageTimeVsScheduled < 0
                                    ? 'success.main'
                                    : statistics.lastMonth.averageTimeVsScheduled > 0
                                    ? 'warning.main'
                                    : 'text.primary',
                              }}
                            >
                              {statistics.lastMonth.averageTimeVsScheduled < 0
                                ? `${formatTimeDuration(-statistics.lastMonth.averageTimeVsScheduled)} faster`
                                : statistics.lastMonth.averageTimeVsScheduled > 0
                                ? `${formatTimeDuration(statistics.lastMonth.averageTimeVsScheduled)} slower`
                                : 'On schedule'}
                            </Typography>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {statistics.currentMonth.averageTimeVsScheduled !== null ? (
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  statistics.currentMonth.averageTimeVsScheduled < 0
                                    ? 'success.main'
                                    : statistics.currentMonth.averageTimeVsScheduled > 0
                                    ? 'warning.main'
                                    : 'text.primary',
                              }}
                            >
                              {statistics.currentMonth.averageTimeVsScheduled < 0
                                ? `${formatTimeDuration(-statistics.currentMonth.averageTimeVsScheduled)} faster`
                                : statistics.currentMonth.averageTimeVsScheduled > 0
                                ? `${formatTimeDuration(statistics.currentMonth.averageTimeVsScheduled)} slower`
                                : 'On schedule'}
                            </Typography>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {statistics.allTime.averageTimeVsScheduled !== null ? (
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  statistics.allTime.averageTimeVsScheduled < 0
                                    ? 'success.main'
                                    : statistics.allTime.averageTimeVsScheduled > 0
                                    ? 'warning.main'
                                    : 'text.primary',
                              }}
                            >
                              {statistics.allTime.averageTimeVsScheduled < 0
                                ? `${formatTimeDuration(-statistics.allTime.averageTimeVsScheduled)} faster`
                                : statistics.allTime.averageTimeVsScheduled > 0
                                ? `${formatTimeDuration(statistics.allTime.averageTimeVsScheduled)} slower`
                                : 'On schedule'}
                            </Typography>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Calendar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Calendar
          </Typography>
          <MonthCalendar
            records={activity.records}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </Box>

        {/* Records List */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">
              Records ({showMonthRecordsOnly ? sortedRecords.length : activity.records.length})
            </Typography>
            <Button
              size="small"
              variant={showMonthRecordsOnly ? 'contained' : 'outlined'}
              onClick={() => setShowMonthRecordsOnly(!showMonthRecordsOnly)}
            >
              {showMonthRecordsOnly
                ? `Showing ${format(currentMonth, 'MMMM yyyy')}`
                : 'Show Current Month'}
            </Button>
          </Box>
          {sortedRecords.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {showMonthRecordsOnly
                ? `No records in ${format(currentMonth, 'MMMM yyyy')}.`
                : 'No records yet. Add your first record using the button below.'}
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
