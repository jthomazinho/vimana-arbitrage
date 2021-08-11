import React, { useState, useEffect, useContext } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import InputAdornment from '@material-ui/core/InputAdornment';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import formatter from '../shared/formatter';
import AlertDialog from '../../components/alert-dialog';
import AlertFeedback, { Feedback, FeedbackType } from '../../components/alert-feedback';
import Backdrop from '../../components/backdrop';
import initialData from './initial-data';
import Service from './service';
import { AppContext } from '../shared/appContext';
import { useStyles, StyledTableCell, StyledTextField } from './styles';

export default function ExchangeRates() {
  const classes = useStyles();
  const [fields, setFields] = useState({ ...initialData });
  const [open, setOpen] = useState(false);
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.success);
  const [feedbackMessage, setFeedbackMessage] = useState(Feedback[FeedbackType.success].message);

  const [openFeedback, setOpenFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const appContext = useContext(AppContext);

  async function load() {
    const service = new Service(initialData);
    const result = await service.fetch(appContext.instance);

    setFields({ ...result });
  }

  async function save() {
    try {
      const service = new Service(initialData);
      const result = await service.save(fields);

      setFields(result);
      setFeedbackType(FeedbackType.success);
      setFeedbackMessage(Feedback[FeedbackType.success].message);
    } catch (error) {
      setFeedbackType(FeedbackType.error);
      setFeedbackMessage(error.message);
    }

    setOpenBackdrop(false);
    setLoading(false);
    setOpenFeedback(true);
  }

  function onAlertFeedbackClose() {
    setOpenFeedback(false);
  }

  function onClick() {
    setOpen(true);
  }

  function onDeny() {
    setOpen(false);
  }

  function onConfirm() {
    setOpenBackdrop(true);
    setOpen(false);
    setLoading(true);
    save();
  }

  function updateField(name: string, value: string) {
    const updatedFields = {
      ...fields,
      [name]: {
        ...fields[name],
        value,
      },
    };

    setFields(updatedFields);
  }

  function onTextFieldBlur(evt: React.FocusEvent<HTMLInputElement>) {
    const name: string = evt.target.name || '';
    const isPercentage = ['exchange-rate', 'iof-rate'].includes(name);

    updateField(name, isPercentage ? formatter.percentage(evt.target.value) : evt.target.value);
  }

  function onTextFieldChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const name: string = evt.target.name || '';

    updateField(name, evt.target.value);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Backdrop open={openBackdrop} />
      <AlertDialog open={open} onConfirm={onConfirm} onDeny={onDeny} />
      <TableContainer className={classes.table} component={Paper}>
        <Table size="small" aria-label="simple table">
          <TableHead>
            <TableRow>
              <StyledTableCell>Taxa Câmbio %</StyledTableCell>
              <StyledTableCell>IOF %</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell key="exchange-rate">
                <StyledTextField
                  value={fields['exchange-rate'].value}
                  onBlur={onTextFieldBlur}
                  onChange={onTextFieldChange}
                  placeholder="0.00"
                  name="exchange-rate"
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </TableCell>
              <TableCell key="iof-rate">
                <StyledTextField
                  value={fields['iof-rate'].value}
                  onBlur={onTextFieldBlur}
                  onChange={onTextFieldChange}
                  placeholder="0.00"
                  name="iof-rate"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  size="small"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="contained" className={classes.button} onClick={onClick} color="primary">
        Salvar
        {loading && <CircularProgress size={16} className={classes.loader} />}
      </Button>
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
