import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export const AlertContext = createContext({});
export const useAlertContext = () => useContext(AlertContext);
const OPEN_ALERT_KEY = '__spireSageOpenAlert';

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
    window[OPEN_ALERT_KEY] = openAlert;
    if (window.gameController) {
      window.gameController.openAlert = openAlert;
    }
    return () => {
      if (window[OPEN_ALERT_KEY] === openAlert) {
        delete window[OPEN_ALERT_KEY];
      }
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
