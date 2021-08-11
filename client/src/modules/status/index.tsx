import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import { useInterval } from 'beautiful-react-hooks';
import React, { useEffect, useState } from 'react';
import StatusIcon from '../../components/status-icon';
import initialData from './intial-data';
import Service from './service';
import { StyledTableCell, StyledTooltip, useStyles } from './styles';

function ExchangeValues(price: { ask: string; bid: string }, style: string) {
  return (
    <div className={style}>
      <div>
        <b>bid:</b>
        {price.bid}
      </div>
      <div>
        <b>ask:</b>
        {price.ask}
      </div>
    </div>
  );
}

export default function Status() {
  const interval = 5000;
  const classes = useStyles();
  const tooltipClasses = StyledTooltip();
  const [fields, setFields] = useState({ ...initialData });

  async function load() {
    const service = new Service();
    const result = await service.fetch();

    setFields({ ...result });
  }

  useEffect(() => {
    load();
  }, []);

  useInterval(() => {
    load();
  }, interval);

  return (
    <TableContainer className={classes.table} component={Paper}>
      <Table size="small" aria-label="Cotações">
        <TableHead>
          <TableRow>
            <StyledTableCell>
              <span>Foxbit</span>
              <StatusIcon on={fields.foxbit.status} />
            </StyledTableCell>
            <StyledTableCell>
              <span>Bitstamp</span>
              <StatusIcon on={fields.bitstamp.status} />
            </StyledTableCell>
            <StyledTableCell>
              <span>Plural</span>
              <StatusIcon on={fields.plural.status} />
            </StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell className={`${classes.customCellColored} ${classes.customCell}`} key="foxbit">
              <Tooltip classes={tooltipClasses} title={fields.foxbit.date} arrow>
                <div className={classes.priceInfos}>
                  {ExchangeValues(fields.foxbit.price, classes.priceInfos)}
                </div>
              </Tooltip>
            </TableCell>
            <TableCell className={classes.customCell} key="bitstamp">
              <Tooltip classes={tooltipClasses} title={fields.bitstamp.date} arrow>
                <div className={classes.priceInfos}>
                  {ExchangeValues(fields.bitstamp.price, classes.priceInfos)}
                </div>
              </Tooltip>
            </TableCell>
            <TableCell className={`${classes.customCellColored} ${classes.customCell}`} key="plural">
              <Tooltip classes={tooltipClasses} title={fields.plural.date} arrow>
                <p>{`R$ ${fields.plural.quote}`}</p>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
