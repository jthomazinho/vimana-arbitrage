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

export default function ExchangeBuy({ data }: { data: DataItem[] }) {
  const classes = useStyles();

  return (
    <TableContainer className={classes.table} component={Paper}>
      <Table size="small" aria-label="Exchange Compra (BitStamp)">
        <TableHead>
          <TableRow>
            <StyledTableCell colSpan={6}>Exchange Compra (BitStamp)</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell className={classes.column}>Preço Médio</StyledTableCell>
            <StyledTableCell className={classes.column}>Quantidade</StyledTableCell>
            <StyledTableCell className={classes.column}>Fechado (USD)</StyledTableCell>
            <StyledTableCell className={classes.column}>Taxa Taker</StyledTableCell>
            <StyledTableCell className={classes.column}>Taxa Saque (BTC)</StyledTableCell>
            <StyledTableCell
              className={classes.column}
              title="Total Fechado (USD): Valor formado por (Fechado (USD)) + (Total Taxa Taker)."
            >
              Total Fechado (USD)
              <HelpIcon />
            </StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row: DataItem) => (
            <TableRow key={`sell-${row.id}`}>
              <TableCell className={classes.column}>{row.price}</TableCell>
              <TableCell className={classes.column}>{row.quantity}</TableCell>
              <TableCell className={classes.column}>{row.grossTotal}</TableCell>
              <TableCell className={classes.column}>{row.feeTrade}</TableCell>
              <TableCell className={classes.column}>{row.feeWithdraw}</TableCell>
              <TableCell className={classes.column}>{row.netTotal}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
