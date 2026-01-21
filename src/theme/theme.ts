import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
  },
});

export const statusColors = {
  onTrack: '#4caf50',      // Green
  almostOverdue: '#ff9800', // Orange
  shortOverdue: '#ff5722',  // Deep Orange
  overdue: '#f44336'        // Red
};
