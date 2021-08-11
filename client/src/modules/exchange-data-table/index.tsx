import React, { useState, useEffect, useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useInterval } from 'beautiful-react-hooks';
import ExchangeIdentification from './identification';
import ExchangeSell from './sell';
import ExchangeBuy from './buy';
import ExchangeUSD from './usd';
import ExchangeTotal from './total';
import initialData from './initial-data';
import Service from './service';
import { DataTable, Enum } from './interfaces';
import { useStyles } from './style';
import { AppContext } from '../shared/appContext';

export default function ExchangeDataTable() {
  const interval = 1000;
  const appContext = useContext(AppContext);
  const classes = useStyles();
  const [data, setData] = useState(initialData);
  const [seconds, setSeconds] = useState(Service.interval);
  const [fetchCicleInfo, setFetchCicleInfo] = useState('Atualizando em 0 segundos');

  function updateRows(result: DataTable) {
    setData(result);
  }

  async function load() {
    const service = new Service();
    const result = await service.fetch(appContext.instance.id);

    updateRows(result);
  }

  useEffect(() => {
    if (appContext.instance.id) {
      load();
    }
  }, [appContext.instance.id]);

  useEffect(() => {
    load();
  }, []);

  useInterval(() => {
    setFetchCicleInfo(`Atualizando em ${seconds / interval} segundos`);

    if (seconds === 0) {
      setSeconds(Service.interval);
    } else {
      setSeconds(seconds - interval);
    }

    if (seconds === Service.interval) {
      load();
    }
  }, interval);

  return (
    <Box component="div">
      <div>
        <h4 className={classes.fetchCycleInfo}>{fetchCicleInfo}</h4>
      </div>
      <Grid
        className={classes.table}
        container
        direction="row"
      >
        <Grid>
          <ExchangeIdentification data={data[Enum.sell].rows} />
        </Grid>
        <Grid>
          <ExchangeSell data={data[Enum.sell].rows} />
        </Grid>
        <Grid>
          <ExchangeBuy data={data[Enum.buy].rows} />
        </Grid>
        <Grid>
          <ExchangeUSD data={data[Enum.usd].rows} />
        </Grid>
        <Grid>
          <ExchangeTotal data={data[Enum.total].rows} />
        </Grid>
      </Grid>
    </Box>
  );
}
