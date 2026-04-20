import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export const AlertContext = createContext({});
export const useAlertContext = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const handleClose = (_event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const openAlert = useCallback((message, severity = 'success') => {
    setOpen(true);
    setMessage(message);
    setSeverity(severity);
  }, []);

  useEffect(() => {
    let current = true;
    import('../viewer/controllers/GameController')
      .then((module) => {
        if (!current) {
          return;
        }
        module.gameController.openAlert = openAlert;
        window.gameController = module.gameController;
      })
      .catch((error) => {
        console.error('[AlertProvider] failed to load gameController', error);
      });
    return () => {
      current = false;
    };
  }, [openAlert]);

  return (
    <AlertContext.Provider
      value={{
        openAlert,
      }}
    >
      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
      {children}
    </AlertContext.Provider>
  );
};
