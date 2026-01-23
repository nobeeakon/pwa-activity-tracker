import { Button } from '@mui/material';
import { Download } from '@mui/icons-material';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * Button to install the PWA
 *
 * Only visible when:
 * - The app is installable (beforeinstallprompt event has fired)
 * - The app is not already installed (not running in standalone mode)
 */
export function InstallButton() {
  const { isInstallable, installPrompt } = usePWAInstall();

  // Don't render if not installable or already installed
  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      color="inherit"
      startIcon={<Download />}
      onClick={installPrompt}
      sx={{
        ml: 2,
        borderColor: 'white',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.7)',
        },
      }}
      variant="outlined"
    >
      Install App
    </Button>
  );
}
