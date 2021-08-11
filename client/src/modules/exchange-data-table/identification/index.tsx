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

export default function ExchangeIdentification({ data }: { data: DataItem[] }) {
  const classes = useStyles();

  return (
    <TableContainer className={classes.table} component={Paper}>
      <Table size="small" aria-label="Identificação da operação">
        <TableHead>
          <TableRow>
            <StyledTableCell colSpan={2} />
          </TableRow>
          <TableRow>
            <StyledTableCell className={classes.column}>Data</StyledTableCell>
            <StyledTableCell className={classes.column}>Id</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row: DataItem) => (
            <TableRow key={`sell-${row.id}`}>
              <TableCell className={classes.column}>{row.date}</TableCell>
              <TableCell className={classes.column}>{row.id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
