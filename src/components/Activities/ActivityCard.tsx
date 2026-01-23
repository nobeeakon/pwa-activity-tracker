import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { MoreVert, ExpandMore, ExpandLess } from '@mui/icons-material';
import type { Activity, ActivityStatus } from '../../types/activity';
import { activityService } from '../../db/activityService';
import { statusColors } from '../../theme/theme';
import { MonthCalendar } from '../Calendar/MonthCalendar';
import { RecordActivityDialog } from './RecordActivityDialog';
import { calculateActivityStatus, formatTimeDuration } from '../../utils/activityHelpers';

type ActivityCardProps = {
  activity: Activity;
  onEdit: (activity: Activity) => void;
};

export function ActivityCard({ activity, onEdit }: ActivityCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const menuOpen = Boolean(anchorEl);

  const { lastRecordedDate, hoursSinceLastRecord, hoursUntilDue, status } = useMemo(() => {
    return calculateActivityStatus(activity);
  }, [activity]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(activity);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (activity.id) {
      await activityService.deleteActivity(activity.id);
    }
    setDeleteDialogOpen(false);
  };

  const handleRecordClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setRecordDialogOpen(true);
  };

  const handleCalendarToggle = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setCalendarExpanded(!calendarExpanded);
  };


  const statusLabels: Record<ActivityStatus, string> = {
    onTrack: 'On Track',
    almostOverdue: 'Almost Overdue',
    shortOverdue: 'Overdue',
    overdue: 'Very Overdue'
  };

  return (
    <>
      <Card
        sx={{
          width: { xs: '100%', sm: 'auto' },
          minWidth: { sm: 350 },
        }}
      >
        <CardHeader
          title={<Link to={`/activity/${activity.id}`}>{activity.name}</Link>}
          action={
            <IconButton onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
          }
        />
        <CardContent>
          {activity.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {activity.description}
            </Typography>
          )}

          {activity.everyHours !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
               {status &&   <Chip
                label={statusLabels[status]}
                size="small"
                sx={{
                  backgroundColor: statusColors[status],
                  color: 'white'
                }}
              />}
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

          <Button
            variant="contained"
            fullWidth
            onClick={handleRecordClick}
            sx={{ mb: 2 }}
          >
            Record Activity
          </Button>

          <Button
            fullWidth
            onClick={handleCalendarToggle}
            endIcon={calendarExpanded ? <ExpandLess /> : <ExpandMore />}
            sx={{ mb: 1 }}
          >
            {calendarExpanded ? 'Hide Calendar' : 'Show Calendar'}
          </Button>

          {calendarExpanded && (
            <MonthCalendar
              records={activity.records}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
      </Menu>

      {/* Record Activity Dialog */}
      {recordDialogOpen && (
        <RecordActivityDialog
          open={recordDialogOpen}
          onClose={() => setRecordDialogOpen(false)}
          activity={activity}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Activity</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{activity.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
