import React, { ReactNode } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import { useStyles } from './styles';

interface Props {
  [key: string]: ReactNode;
  onClose: () => void;
  children: any,
  open: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
}

function Alert(props: AlertProps) {
  return (
    <MuiAlert elevation={6} variant="filled" severity={props.severity}>
      {props.children}
    </MuiAlert>
  );
}

export enum FeedbackType {
  success = 'success',
  error = 'error',
}

export const Feedback = {
  type: FeedbackType.success,
  [FeedbackType.success]: {
    message: 'Ação realizada com sucesso!',
  },
  [FeedbackType.error]: {
    message: 'Erro ao executar solicitação!',
  },
};

export default function AlertFeedback(props: Props) {
  const classes = useStyles();

  return (
    <Snackbar
      className={classes.inline}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      onClose={props.onClose}
      onClick={props.onClose}
      open={props.open}
      autoHideDuration={3000}
    >
      <Alert severity={props.type}>
        <div className={classes.message}>
          {props.children}
        </div>
      </Alert>
    </Snackbar>
  );
}
