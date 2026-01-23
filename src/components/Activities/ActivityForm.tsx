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
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Typography
} from '@mui/material';
import type { Activity } from '../../types/activity';
import { activityService } from '../../db/activityService';
import { tagService } from '../../db/tagService';
import { ActivityTagSelector } from '../Tags/ActivityTagSelector';

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
    excludedDays: number[] | undefined;
    tagIds: number[];
  };
  error: {
    name?: string;
    excludedDays?: string;
  };
};

export function ActivityForm({ open = true, onClose, activity }: ActivityFormProps) {
  const [formState, setFormState] = useState<FormState>({
    data: {
      name: activity?.name ?? '',
      description: activity?.description ?? '',
      everyHours: activity?.everyHours,
      excludedDays: activity?.excludedDays,
      tagIds: activity?.tagIds ?? []
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
          everyHours: formState.data.everyHours,
          excludedDays: formState.data.excludedDays
        });

        // Update tags
        await tagService.setTagsForActivity(activity.id, formState.data.tagIds);
      } else {
        // Create new activity
        const newActivityId = await activityService.addActivity({
          name: formState.data.name.trim(),
          description: formState.data.description.trim(),
          createdAt: new Date(),
          records: [],
          everyHours: formState.data.everyHours,
          excludedDays: formState.data.excludedDays
        });

        // Add tags to new activity
        if (formState.data.tagIds.length > 0) {
          await tagService.bulkAddTagsToActivity(newActivityId, formState.data.tagIds);
        }
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

        <Box sx={{ mb: 2 }}>
          <ActivityTagSelector
            value={formState.data.tagIds}
            onChange={(tagIds) => {
              setFormState(prev => ({
                ...prev,
                data: { ...prev.data, tagIds }
              }));
            }}
          />
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={hasSchedule}
              onChange={(e) => {
                setFormState(prev => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    everyHours: e.target.checked ? 24 : undefined,
                    excludedDays: e.target.checked ? prev.data.excludedDays : undefined
                  }
                }));
              }}
            />
          }
          label="Set a reminder schedule"
          sx={{ mb: 1 }}
        />
        {hasSchedule && (
          <>
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
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Exclude days (optional):
              </Typography>
              <ToggleButtonGroup
                value={formState.data.excludedDays || []}
                onChange={(_, newDays: number[]) => {
                  // Prevent selecting all 7 days
                  if (newDays.length === 7) {
                    setFormState(prev => ({
                      ...prev,
                      error: { ...prev.error, excludedDays: 'Cannot exclude all days' }
                    }));
                    return;
                  }
                  setFormState(prev => ({
                    data: { ...prev.data, excludedDays: newDays.length > 0 ? newDays : undefined },
                    error: { ...prev.error, excludedDays: undefined }
                  }));
                }}
                size="small"
                fullWidth
              >
                <ToggleButton value={0}>Su</ToggleButton>
                <ToggleButton value={1}>Mo</ToggleButton>
                <ToggleButton value={2}>Tu</ToggleButton>
                <ToggleButton value={3}>We</ToggleButton>
                <ToggleButton value={4}>Th</ToggleButton>
                <ToggleButton value={5}>Fr</ToggleButton>
                <ToggleButton value={6}>Sa</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Selected days won't count for scheduling
              </Typography>
              {formState.error.excludedDays && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  {formState.error.excludedDays}
                </Typography>
              )}
            </Box>
          </>
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
