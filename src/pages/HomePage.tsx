import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Fab,
  Box,
  Button
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useActivities } from '../hooks/useActivities';
import { ActivityList } from '../components/Activities/ActivityList';
import { ActivityForm } from '../components/Activities/ActivityForm';
import { InstallButton } from '../components/InstallButton';

export function HomePage() {
  const activities = useActivities();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Activity Tracker
          </Typography>
          <InstallButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {activities.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
              No activities yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Add your first activity to get started!
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Add Activity
            </Button>
          </Box>
        ) : (
          <ActivityList activities={activities} />
        )}
      </Container>

      {activities.length > 0 && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setFormOpen(true)}
        >
          <Add />
        </Fab>
      )}

      {formOpen && (
        <ActivityForm
          onClose={() => setFormOpen(false)}
        />
      )}
    </Box>
  );
}