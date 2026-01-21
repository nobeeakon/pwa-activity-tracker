import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  TextField
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { format, isSameDay, differenceInHours } from 'date-fns';
import type { Activity } from '../../types/activity';
import { activityService } from '../../db/activityService';
import { MAX_NOTE_LENGTH } from '../../utils/activityHelpers';

type RecordActivityDialogProps = {
  open: boolean;
  onClose: () => void;
  activity: Activity;
};

type Step = 'selection' | 'confirmation';

export function RecordActivityDialog({ open, onClose, activity }: RecordActivityDialogProps) {
  const [step, setStep] = useState<Step>('selection');
  const [selectedDateTime, setSelectedDateTime] = useState<Dayjs | null>(dayjs());
  const [note, setNote] = useState<string>('');
  const [submitState, setSubmitState] = useState<{ submitting: boolean; error: string | null }>({
    submitting: false,
    error: null
  });

  // Check if selected date is in the future
  const isFutureDate = useMemo(() => {
    if (!selectedDateTime) return false;
    return selectedDateTime.isAfter(dayjs());
  }, [selectedDateTime]);

  // Check for duplicate records within ±8 hours
  const hasDuplicateWarning = useMemo(() => {
    if (!selectedDateTime) return false;
    
    const selectedDate = selectedDateTime.toDate();
    
    return activity.records.some(record => {
      if (!isSameDay(selectedDate, record.date)) return false;
      
      const hoursDiff = Math.abs(differenceInHours(selectedDate, record.date));
      return hoursDiff <= 8;
    });
  }, [selectedDateTime, activity.records]);

  const handleRecordNow = () => {
    setSelectedDateTime(dayjs());
    setStep('confirmation');
  };

  const handleNext = () => {
    if (!isFutureDate && selectedDateTime) {
      setStep('confirmation');
    }
  };

  const handleBack = () => {
    setStep('selection');
    setSubmitState({ submitting: false, error: null });
  };

  const handleSave = async () => {
    if (!selectedDateTime || !activity.id) return;

    setSubmitState({ submitting: true, error: null });

    try {
      await activityService.recordDate(activity.id, selectedDateTime.toDate(), note || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to record activity:', error);
      setSubmitState({ submitting: false, error: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitState(prev => ({...prev,  submitting: false }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Activity</DialogTitle>
      
      {step === 'selection' && (
        <>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleRecordNow}
                size="large"
              >
                Record Now
              </Button>

              <Divider>
                <Typography variant="caption" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select a past date and time:
                </Typography>
                
                <DateTimePicker
                  value={selectedDateTime}
                  onChange={(newValue) => setSelectedDateTime(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: isFutureDate,
                      helperText: isFutureDate ? 'Cannot record activities in the future' : ' '
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Add a note (optional):
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={note}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_NOTE_LENGTH) {
                      setNote(e.target.value);
                    }
                  }}
                  placeholder="Add any notes about this activity..."
                  helperText={`${note.length}/${MAX_NOTE_LENGTH} characters`}
                />
              </Box>

              {hasDuplicateWarning && !isFutureDate && (
                <Alert severity="warning">
                  You already have a record within 8 hours of this time on the same day.
                </Alert>
              )}
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!selectedDateTime || isFutureDate}
            >
              Next
            </Button>
          </DialogActions>
        </>
      )}

      {step === 'confirmation' && selectedDateTime && (
        <>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Record "{activity.name}" as done at:
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              {format(selectedDateTime.toDate(), 'PPpp')}
            </Typography>

            {note && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Note:
                </Typography>
                <Typography variant="body2">{note}</Typography>
              </Box>
            )}

            {submitState.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitState.error}
              </Alert>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleBack} disabled={submitState.submitting}>
              Back
            </Button>
            <Button onClick={onClose} disabled={submitState.submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={submitState.submitting}
              autoFocus
            >
              Save
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
