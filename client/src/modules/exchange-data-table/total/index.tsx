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

export default function ExchangeUSD({ data }: { data: DataItem[] }) {
  const classes = useStyles();

  function translateBoolean(value: boolean) {
    return value ? 'POSITIVO' : 'NEGATIVO';
  }

  return (
    <TableContainer className={classes.table} component={Paper}>
      <Table size="small" aria-label="Totais Estimados">
        <TableHead>
          <TableRow>
            <StyledTableCell colSpan={3}>Totais Estimados</StyledTableCell>
            <StyledTableCell>Spread</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell className={classes.column}>$ (USD)</StyledTableCell>
            <StyledTableCell className={classes.column}>$ (BRL)</StyledTableCell>
            <StyledTableCell className={classes.column}>%</StyledTableCell>
            <StyledTableCell className={classes.column}>Condição</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row: DataItem) => (
            <TableRow key={`sell-${row.id}`}>
              <TableCell className={classes.column}>{row.usd}</TableCell>
              <TableCell className={classes.column}>{row.brl}</TableCell>
              <TableCell className={classes.column}>{row.spread}</TableCell>
              <TableCell className={classes.column}>{translateBoolean(row.targetReached)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
