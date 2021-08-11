import React, { useState, useEffect, useContext } from 'react';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Switch from '@material-ui/core/Switch';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import AlertDialog from '../../components/alert-dialog';
import Backdrop from '../../components/backdrop';
import AlertFeedback, { Feedback, FeedbackType } from '../../components/alert-feedback';
import { AppContext } from '../shared/appContext';
import Service from './service';
import { useStyles } from './styles';
import { Data, State } from '../shared/api/bot-instance/interfaces';

interface Props {
  onCreateInstance: (data: Data) => void;
  onTooglePauseInstance: (data: Data) => void;
  onFinalizeInstance: () => void;
}

export default function Controls(props: Props) {
  const classes = useStyles();
  const appContext = useContext(AppContext);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.success);
  const [feedbackMessage, setFeedbackMessage] = useState(Feedback[FeedbackType.success].message);
  const [openFeedback, setOpenFeedback] = useState(false);
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingFinalize, setLoadingFinalize] = useState(false);
  const [disableSwitch, setDisableSwitch] = useState(true);
  const [disableFinalize, setDisableFinalize] = useState(true);

  const actions: { [x: string]: any } = {
    async finalize(service: Service) {
      setLoadingFinalize(true);

      try {
        await service.finalize(appContext.instance.id);
        props.onFinalizeInstance();
        setFeedbackType(FeedbackType.success);
        setFeedbackMessage(Feedback[FeedbackType.success].message);
      } catch (error) {
        setFeedbackType(FeedbackType.error);
        setFeedbackMessage(Feedback[FeedbackType.error].message);
      }

      setCurrentAction('');
      setLoadingFinalize(false);
      setOpenFeedback(true);
    },
    async create(service: Service) {
      setLoadingCreate(true);

      try {
        await service.createMaker();
        const result = await service.create();
        props.onCreateInstance(result);
        setFeedbackType(FeedbackType.success);
        setFeedbackMessage(Feedback[FeedbackType.success].message);
      } catch (error) {
        setFeedbackType(FeedbackType.error);
        setFeedbackMessage(Feedback[FeedbackType.error].message);
      }

      setCurrentAction('');
      setLoadingCreate(false);
      setOpenFeedback(true);
    },
  };

  function displayState(context: Data) {
    if (context.state === State.error) {
      return `${context.state} - ${context.output.errorMsg}`;
    }

    return context.state;
  }

  function onAlertFeedbackClose() {
    setOpenFeedback(false);
  }

  function onCreateNewInstanceClick() {
    setCurrentAction('create');
  }

  async function onSwitchClick() {
    setOpenBackdrop(true);

    try {
      const service = new Service();
      const result = await service.tooglePause(appContext.instance.id);

      props.onTooglePauseInstance(result.data);
      setFeedbackType(FeedbackType.success);
      setFeedbackMessage(Feedback[FeedbackType.success].message);
    } catch (error) {
      setFeedbackType(FeedbackType.error);
      setFeedbackMessage(Feedback[FeedbackType.error].message);
    }

    setOpenBackdrop(false);
  }

  function onFinalizeClick() {
    setCurrentAction('finalize');
  }

  function onDeny() {
    setCurrentAction('');
    setOpen(false);
  }

  async function onConfirm() {
    setOpen(false);

    const service = new Service();

    if (actions[currentAction]) {
      actions[currentAction](service);
    }
  }

  function isActive() {
    switch (appContext.state) {
      case State.paused:
      case State.finalized:
        return false;
      default:
        return true;
    }
  }

  function isDisable() {
    switch (appContext.state) {
      case State.paused:
      case State.waitingOrders:
      case State.monitoring:
        return false;
      default:
        return true;
    }
  }

  function isFinalizeDisable() {
    return appContext.state === State.finalized;
  }

  useEffect(() => {
    setDisableSwitch(isDisable());
    setDisableFinalize(isFinalizeDisable());
  }, [appContext.state]);

  useEffect(() => {
    if (currentAction) {
      setOpenBackdrop(true);
      setOpen(true);
    } else {
      setOpenBackdrop(false);
    }
  }, [currentAction]);

  return (
    <>
      <Backdrop open={openBackdrop} />
      <AlertDialog open={open} onConfirm={onConfirm} onDeny={onDeny} />
      <Grid
        className={classes.controls}
        container
        direction="row"
        alignItems="flex-start"
      >
        <Grid className={classes.switch} component="label" container alignItems="center" spacing={1}>
          <Grid item>Inactive</Grid>
          <Grid item>
            <Switch disabled={disableSwitch} name="checked" checked={isActive()} onClick={onSwitchClick} />
          </Grid>
          <Grid item>Active</Grid>
        </Grid>
        <Button variant="contained" onClick={onCreateNewInstanceClick} className={classes.button} color="primary">
          Criar nova instancia
          {loadingCreate && <CircularProgress size={16} className={classes.loader} />}
        </Button>
        <Button
          disabled={disableFinalize}
          variant="contained"
          onClick={onFinalizeClick}
          className={classes.button}
          color="secondary"
        >
          Finalizar
          {loadingFinalize && <CircularProgress size={16} className={classes.loader} />}
        </Button>
        <Chip className={classes.status} label={`Status: ${displayState(appContext)}`} />
      </Grid>
      <AlertFeedback
        onClose={onAlertFeedbackClose}
        open={openFeedback}
        type={feedbackType}
      >
        {feedbackMessage}
      </AlertFeedback>
    </>
  );
}
