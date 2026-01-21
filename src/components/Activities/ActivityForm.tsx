import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import type { Activity } from '../../types/activity';
import { activityService } from '../../db/activityService';

type ActivityFormProps = {
  open?: boolean;
  onClose: () => void;
  activity?: Activity;
};

type FormState = {
  data: {
    name: string;
    description: string;
    everyHours: number | undefined;
  };
  error: {
    name?: string;
  };
};

export function ActivityForm({ open = true, onClose, activity }: ActivityFormProps) {
  const [formState, setFormState] = useState<FormState>({
    data: {
      name: activity?.name ?? '',
      description: activity?.description ?? '',
      everyHours: activity?.everyHours
    },
    error: {}
  });

  // Derive hasSchedule from everyHours
  const hasSchedule = formState.data.everyHours !== undefined;
  const everyDays = formState.data.everyHours ? formState.data.everyHours / 24 : 1;

  const handleSubmit = async () => {
    if (!formState.data.name.trim()) {
      setFormState(prev => ({
        ...prev,
        error: { name: 'Name is required' }
      }));
      return;
    }

    try {
      if (activity?.id) {
        // Update existing activity
        await activityService.updateActivity(activity.id, {
          name: formState.data.name.trim(),
          description: formState.data.description.trim(),
          everyHours: formState.data.everyHours
        });
      } else {
        // Create new activity
        await activityService.addActivity({
          name: formState.data.name.trim(),
          description: formState.data.description.trim(),
          createdAt: new Date(),
          records: [],
          everyHours: formState.data.everyHours
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{activity ? 'Edit Activity' : 'Add New Activity'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Activity Name"
          fullWidth
          required
          value={formState.data.name}
          onChange={(e) => {
            setFormState(prev => ({
              data: { ...prev.data, name: e.target.value },
              error: {}
            }));
          }}
          error={!!formState.error.name}
          helperText={formState.error.name || ''}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={formState.data.description}
          onChange={(e) => {
            setFormState(prev => ({
              ...prev,
              data: { ...prev.data, description: e.target.value }
            }));
          }}
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={hasSchedule}
              onChange={(e) => {
                setFormState(prev => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    everyHours: e.target.checked ? 24 : undefined
                  }
                }));
              }}
            />
          }
          label="Set a reminder schedule"
          sx={{ mb: 1 }}
        />
        {hasSchedule && (
          <TextField
            margin="dense"
            label="Repeat Every"
            type="number"
            fullWidth
            required
            value={everyDays}
            onChange={(e) => {
              const days = Math.max(0.1, parseFloat(e.target.value) || 0.1);
              setFormState(prev => ({
                ...prev,
                data: { ...prev.data, everyHours: days * 24 }
              }));
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">days</InputAdornment>,
              inputProps: { min: 1, step: 1 }
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {activity ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
