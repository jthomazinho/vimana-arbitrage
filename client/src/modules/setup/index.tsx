import React, { useState, useEffect, useContext } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import InputAdornment from '@material-ui/core/InputAdornment';
import Paper from '@material-ui/core/Paper';
import formatter from '../shared/formatter';
import AlertDialog from '../../components/alert-dialog';
import AlertFeedback, { Feedback, FeedbackType } from '../../components/alert-feedback';
import Backdrop from '../../components/backdrop';
import initialData from './initial-data';
import Service from './service';
import { useStyles, StyledTableCell, StyledTextField } from './styles';
import { AppContext } from '../shared/appContext';
import HelpIcon from '../../components/help-icon';

export default function Setup() {
  const classes = useStyles();
  const [fields, setFields] = useState({ ...initialData });
  const [open, setOpen] = useState(false);
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [openFeedback, setOpenFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.success);
  const [feedbackMessage, setFeedbackMessage] = useState(Feedback[FeedbackType.success].message);
  const [loading, setLoading] = useState(false);
  const appContext = useContext(AppContext);

  async function load() {
    const service = new Service();
    const result = service.transform(appContext);

    setFields({ ...result });
  }

  async function save() {
    const service = new Service();

    try {
      const result = await service.save(fields, appContext.instance.id);
      setFields(result);
      setFeedbackType(FeedbackType.success);
      setFeedbackMessage(Feedback[FeedbackType.success].message);
    } catch (error) {
      setFeedbackType(FeedbackType.error);
      setFeedbackMessage(error.message);
    }

    setLoading(false);
    setOpenBackdrop(false);
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
    setOpen(false);
    setLoading(true);
    setOpenBackdrop(true);
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

    let value = evt.target.value;

    if (fields[name].percentage) {
      value = formatter.percentage(evt.target.value);
    } else if (fields[name].currency) {
      value = formatter.currency(evt.target.value);
    }

    updateField(name, value);
  }

  function onTextFieldChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const name: string = evt.target.name || '';

    updateField(name, evt.target.value);
  }

  useEffect(() => {
    if (appContext.instance.id) {
      load();
    }
  }, [appContext.instance.id]);

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
              <StyledTableCell />

              <StyledTableCell title="Lote: Montante designado para este tipo de operação.">
                Lote
                <HelpIcon />
              </StyledTableCell>
              <StyledTableCell title="Quebra: Quantidade máxima por execução.">
                Quebra
                <HelpIcon />
              </StyledTableCell>
              <StyledTableCell>Spread (Final) %</StyledTableCell>
              <StyledTableCell
                title="Valor da cotação sem a Taxa Câmbio e IOF. Valor mínimo de segurança: R$ 4,50.
                Esse campo funciona apenas com o Plural fora do ar."
              >
                Câmbio Manual
                <HelpIcon />
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell key="setup">Setup</TableCell>
              <TableCell key="totalQuantity">
                <StyledTextField
                  value={fields.totalQuantity.value}
                  onBlur={onTextFieldBlur}
                  onChange={onTextFieldChange}
                  placeholder="0.00"
                  name="totalQuantity"
                  size="small"
                />
              </TableCell>
              <TableCell key="maxOrderQuantity">
                <StyledTextField
                  value={fields.maxOrderQuantity.value}
                  onBlur={onTextFieldBlur}
                  onChange={onTextFieldChange}
                  placeholder="0.00"
                  name="maxOrderQuantity"
                />
              </TableCell>
              <TableCell key="targetSpread">
                <StyledTextField
                  value={fields.targetSpread.value}
                  onBlur={onTextFieldBlur}
                  onChange={onTextFieldChange}
                  placeholder="0.00"
                  name="targetSpread"
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </TableCell>
              <TableCell key="manualPegQuote">
                <StyledTextField
                  value={fields.manualPegQuote.value}
                  onBlur={onTextFieldBlur}
                  onChange={onTextFieldChange}
                  placeholder="0.0000"
                  name="manualPegQuote"
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
