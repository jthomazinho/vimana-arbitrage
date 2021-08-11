import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

interface Props {
  onConfirm: () => void;
  onDeny: () => void;
  open: boolean;
}

export default function AlertDialog(props: Props) {
  function confirm() {
    props.onConfirm();
  }

  function deny() {
    props.onDeny();
  }

  return (
    <Dialog
      open={props.open}
      onClose={props.onDeny}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Atenção</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">Deseja continuar com esta ação?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={deny} color="primary">Não</Button>
        <Button onClick={confirm} color="primary" autoFocus>Sim </Button>
      </DialogActions>
    </Dialog>
  );
}
