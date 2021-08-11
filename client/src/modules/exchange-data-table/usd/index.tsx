import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { useStyles, StyledTableCell } from './style';
import { DataItem } from './interfaces';
import HelpIcon from '../../../components/help-icon';

export default function ExchangeUSD({ data }: { data: DataItem[] }) {
  const classes = useStyles();

  return (
    <TableContainer className={classes.table} component={Paper}>
      <Table size="small" aria-label="Câmbio USDBRL">
        <TableHead>
          <TableRow>
            <StyledTableCell colSpan={6}>Câmbio USDBRL</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell className={classes.column}>Cotação USD</StyledTableCell>
            <StyledTableCell className={classes.column}>Taxa (BRL)</StyledTableCell>
            <StyledTableCell className={classes.column}>IOF (BRL)</StyledTableCell>
            <StyledTableCell
              className={classes.column}
              title="A Comprar (BRL): Valor formado por (Venda (BRL)) - (Taxa Taker)."
            >
              A Comprar (BRL)
              <HelpIcon />
            </StyledTableCell>
            <StyledTableCell
              className={classes.column}
              title="Comprar (USD): Valor formado por (Vender (BRL)) / (Cotação USDBRL)"
            >
              Comprar (USD)
              <HelpIcon />
            </StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row: DataItem) => (
            <TableRow key={`sell-${row.id}`}>
              <TableCell className={classes.column}>{row.price}</TableCell>
              <TableCell className={classes.column}>{row.unitFeeExchange}</TableCell>
              <TableCell className={classes.column}>{row.unitFeeIof}</TableCell>
              <TableCell className={classes.column}>{row.longTotal}</TableCell>
              <TableCell className={classes.column}>{row.buyUsd}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
