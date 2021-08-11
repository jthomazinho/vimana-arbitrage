/* eslint-disable react/jsx-no-duplicate-props */
import React, { useState, useEffect } from 'react';
import TableCell from '@material-ui/core/TableCell';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import InputAdornment from '@material-ui/core/InputAdornment';
import transform from './transform';
import AlertDialog from '../../components/alert-dialog';
import Backdrop from '../../components/backdrop';
import AlertFeedback, { Feedback, FeedbackType } from '../../components/alert-feedback';
import initialData from './initial-data';
import Service from './service';
import {
  DataItem,
  Data,
  Field,
} from './interfaces';
import { useStyles, StyledTableCell, StyledTextField } from './styles';

export default function ExchangeFees() {
  const classes = useStyles();
  const [fields, setFields] = useState<Data>({ ...initialData });
  const [open, setOpen] = useState(false);
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [openFeedback, setOpenFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.success);
  const [feedbackMessage, setFeedbackMessage] = useState(Feedback[FeedbackType.success].message);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([
    [...Object.entries(initialData.foxbit)],
    [...Object.entries(initialData.bitstamp)],
  ]);

  function onClick() {
    setOpen(true);
  }

  function updateRows(result: Data) {
    setRows([[...Object.entries(result.foxbit)], [...Object.entries(result.bitstamp)]]);
  }

  function onAlertFeedbackClose() {
    setOpenFeedback(false);
  }

  async function load() {
    const service = new Service(initialData);
    const result = await service.fetch();

    setFields({ ...result });
    updateRows(result);
  }

  async function save() {
    try {
      const service = new Service(initialData);
      const result = await service.save(fields);

      setFields({ ...result });
      updateRows(result);
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

  function onDeny() {
    setOpen(false);
  }

  function onConfirm() {
    setOpenBackdrop(true);
    setOpen(false);
    setLoading(true);
    save();
  }

  function updateFields(inputs: Data, field: Field) {
    const updatedField = {
      ...inputs[field.prefix],
      [field.name]: {
        ...inputs[field.prefix][field.name],
        value: field.value,
      },
    };

    const result: Data = {
      ...inputs,
      [field.prefix]: { ...inputs[field.prefix], ...updatedField },
    };

    setFields({ ...result });

    updateRows({ ...result });
  }

  function onTextFieldBlur(evt: React.FocusEvent<HTMLInputElement>) {
    const { name = '', value }: { name: string; value: string } = evt.target;
    const prefix: string = evt.target.dataset.prefix || '';
    const currentField: Field = {
      name, prefix, value: transform.format(name, value),
    };

    updateFields(fields, currentField);
  }

  function onTextFieldChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const name: string = evt.target.name || '';
    const prefix: string = evt.target.dataset.prefix || '';
    const currentField: Field = {
      name, prefix, value: evt.target.value,
    };

    updateFields(fields, currentField);
  }

  function tableCell([name, item]: [string, DataItem]) {
    if (item.type === 'text') {
      return <TableCell key={name}>{item.value}</TableCell>;
    }

    return (
      <TableCell key={name}>
        <StyledTextField
          value={item.value}
          onChange={onTextFieldChange}
          onBlur={onTextFieldBlur}
          placeholder={name.includes('fixed') && !name.includes('brl-fixed') ? '0.0000' : '0.00'}
          name={name}
          size="small"
          inputProps={{ 'data-id': item.id, 'data-prefix': item.prefix }}
          InputProps={{
            endAdornment: item.percentage ? <InputAdornment position="end">%</InputAdornment> : null,
          }}
        />
      </TableCell>
    );
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
              <StyledTableCell>Moeda</StyledTableCell>
              <StyledTableCell>Exchange</StyledTableCell>
              <StyledTableCell>Operação</StyledTableCell>
              <StyledTableCell className={classes.column}>Ordem Maker %</StyledTableCell>
              <StyledTableCell className={classes.column}>Ordem Taker %</StyledTableCell>
              <StyledTableCell className={classes.column}>Saque %</StyledTableCell>
              <StyledTableCell className={classes.column}>Saque Fixo (BRL)</StyledTableCell>
              <StyledTableCell className={classes.column}>Saque (BTC) %</StyledTableCell>
              <StyledTableCell className={classes.column}>Saque (BTC) Fixo</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: any) => (
              <TableRow key={row[0][0]}>
                {row.map((cell: any) => tableCell(cell))}
              </TableRow>
            ))}
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
