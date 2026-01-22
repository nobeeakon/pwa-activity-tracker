import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Box,
  Alert,
  AlertTitle
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

type MultiTabWarningDialogProps = {
  open: boolean;
};

export function MultiTabWarningDialog({ open }: MultiTabWarningDialogProps) {
  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningAmberIcon color="warning" fontSize="large" />
          <span>Multiple Tabs Detected</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Action Required</AlertTitle>
          To prevent database conflicts and data loss, only one tab can be active at a time.
        </Alert>
        <DialogContentText>
          Please close all other tabs or windows of this application to continue.
          This dialog will automatically dismiss once only one tab remains open.
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}
