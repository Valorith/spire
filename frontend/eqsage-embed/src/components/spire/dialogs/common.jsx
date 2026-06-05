import React, { Children, forwardRef, useMemo, useRef } from 'react';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

import './dialog.scss';
import classNames from 'classnames';

export const PaperComponent = forwardRef(function PaperComponent({
  handleSelector = '#draggable-dialog-title',
  onDrag,
  onStop,
  ...props
}, ref) {
  const nodeRef = useRef(null);
  const handleRef = (node) => {
    nodeRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };
  return (
    <Draggable
      nodeRef={nodeRef}
      handle={handleSelector}
      onDrag={onDrag}
      onStop={onStop}
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper ref={handleRef} sx={{ pointerEvents: 'auto' }} {...props} />
    </Draggable>
  );
});

export const CommonDialog = ({
  onClose,
  children,
  title = '',
  fullWidth = false,
  open = true,
  cancelButton = false,
  doneText = 'Done',
  doneDisabled = false,
  hideBackdrop = true,
  disableEnforceFocus = true,
  hideButtons = false,
  maxWidth = 'md',
  className = '',
  additionalButtons = null,
  sx = {},
  noEscClose = false,
  onDrag = undefined,
  onStop = undefined
}) => {
  const dialogTitleId = useMemo(
    () => `draggable-dialog-title-${Math.random().toString(36).slice(2)}`,
    []
  );
  const paperComponent = useMemo(
    () =>
      props =>
        (
          <PaperComponent
            {...props}
            handleSelector={`#${dialogTitleId}`}
            onDrag={onDrag}
            onStop={onStop}
          />
        ),
    [dialogTitleId, onDrag, onStop]
  );
  const dialogChildren = useMemo(() => Children.toArray(children), [children]);
  const actionButtons = useMemo(
    () => Children.toArray(additionalButtons),
    [additionalButtons]
  );
  return (
    <Dialog
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !noEscClose) {
          onClose();
        }
      }}
      open={open}
      disablePortal
      disableEnforceFocus={disableEnforceFocus}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      className={'ui-dialog'}
      sx={{ pointerEvents: 'none', ...sx }}
      slotProps={{ backdrop: { sx: { pointerEvents: 'none' } } }}
      hideBackdrop={hideBackdrop}
      PaperComponent={paperComponent}
      aria-labelledby={dialogTitleId}
    >
      <DialogTitle
        className="ui-dialog-title"
        style={{ cursor: 'move' }}
        id={dialogTitleId}
      >
        {title}
      </DialogTitle>
      <DialogContent sx={{ overflowX: 'hidden' }} className={className}>
        {dialogChildren}
      </DialogContent>
      {!hideButtons && (
        <DialogActions>
          {cancelButton && (
            <Button className="ui-dialog-btn" onClick={() => onClose(false)}>
              Cancel
            </Button>
          )}
          {actionButtons}
          <Button
            variant='outlined'
            disabled={doneDisabled}
            className={classNames('ui-dialog-btn', {
              'ui-dialog-btn-disabled': doneDisabled,
            })}
            autoFocus
            onClick={() => onClose(true)}
          >
            {doneText}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
