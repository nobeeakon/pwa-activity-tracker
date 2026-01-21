import { useState, useEffect } from 'react';
import { 
  Grid, 
  Box, 
  TextField, 
  ToggleButton, 
  InputAdornment,
  Typography
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon , Check as CheckIcon} from '@mui/icons-material';
import type { Activity } from '../../types/activity';
import { ActivityCard } from './ActivityCard';
import { ActivityForm } from './ActivityForm';

type ActivityListProps = {
  activities: Activity[];
};

type ActivityType = 'scheduled' | 'nonScheduled';

export function ActivityList({ activities }: ActivityListProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [debouncedNameFilter, setDebouncedNameFilter] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>(['scheduled', 'nonScheduled']);

  // Debounce name filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameFilter(nameFilter);
    }, 200);

    return () => clearTimeout(timer);
  }, [nameFilter]);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    // Name filter
    if (debouncedNameFilter && !activity.name.toLowerCase().includes(debouncedNameFilter.toLowerCase())) {
      return false;
    }

    // Type filter
    if (selectedTypes.length > 0 && selectedTypes.length < 2) {
      const isScheduled = activity.everyHours !== undefined;
      if (selectedTypes.includes('scheduled') && !isScheduled) return false;
      if (selectedTypes.includes('nonScheduled') && isScheduled) return false;
    }

    return true;
  });

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingActivity(undefined);
  };

  const handleTypeFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: string | null
  ) => {
    if (newValue === null) return;
    
    const clickedType = newValue as ActivityType;
    
    setSelectedTypes(prev => {
      if (prev.includes(clickedType)) {
        // Remove if already selected
        return prev.filter(t => t !== clickedType);
      } else {
        // Add if not selected
        return [...prev, clickedType];
      }
    });
  };

  return (
    <>
      <Box 
        sx={{ 
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' }
        }}
      >
        <TextField
          placeholder="Search activities..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: '250px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <ToggleButton
            value="scheduled"
            selected={selectedTypes.includes('scheduled')}
            onChange={handleTypeFilterChange}
            size="small"
            sx={{ flex: { xs: 1, sm: 'initial' } }}
            >
            {selectedTypes.includes('scheduled') && <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />}
            Scheduled
            </ToggleButton>
          <ToggleButton
            value="nonScheduled"
            selected={selectedTypes.includes('nonScheduled')}
            onChange={handleTypeFilterChange}
            size="small"
            sx={{ flex: { xs: 1, sm: 'initial' } }}
          >
            {selectedTypes.includes('nonScheduled') && <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />}
            Non Scheduled
          </ToggleButton>
        </Box>
      </Box>

      {filteredActivities.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <FilterListIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">
            No activities match your filters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} columns={{ xs: 1, sm: 12 }}>
          {filteredActivities.map(activity => (
            <Grid item key={activity.id}>
              <ActivityCard activity={activity} onEdit={handleEdit} />
            </Grid>
          ))}
        </Grid>
      )}

      {formOpen && (
        <ActivityForm
          onClose={handleFormClose}
          activity={editingActivity}
        />
      )}
    </>
  );
}
