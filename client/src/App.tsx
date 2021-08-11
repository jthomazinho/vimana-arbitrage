import Grid from '@material-ui/core/Grid';
import React, { useState, useEffect } from 'react';
import { useInterval } from 'beautiful-react-hooks';
import {
  Controls,
  MakerControls,
  ExchangeDataTable,
  ExchangeFees,
  ExchangeOTC,
  ExchangeRates,
  Setup,
  Status,
} from './modules';
import useStyles from './styles/app';
import { initialData } from './modules/shared/api/bot-instance/initial-data';
import { Data, State } from './modules/shared/api/bot-instance/interfaces';
import { AppContext } from './modules/shared/appContext';
import BotInstance from './modules/shared/api/bot-instance';
import './styles/index.css';
import './styles/overrides.css';

const instance = new BotInstance();

export default function App() {
  const interval = 1500;
  const classes = useStyles();
  const [botInstance, setBotInstance] = useState<Data>(initialData);

  async function load() {
    const result = await instance.fetch();

    setBotInstance(result);
  }

  function updateAppContext(data: Data) {
    setBotInstance(data);
  }

  function onFinalizeInstance() {
    setBotInstance({ ...botInstance, state: State.finalized });
  }

  useInterval(() => {
    if (botInstance.state !== State.finalized) {
      load();
    }
  }, interval);

  useEffect(() => {
    load();
  }, []);

  return (
    <AppContext.Provider value={botInstance}>
      <div className={classes.root}>
        <Grid
          container
          direction="column"
        >
          <Grid
            container
            direction="row"
            alignItems="flex-start"
          >
            <Grid>
              <ExchangeFees />
            </Grid>
            <Grid className={classes.rates}>
              <ExchangeOTC />
            </Grid>
          </Grid>
          <Grid
            container
            direction="row"
            alignItems="flex-start"
          >
            <Grid>
              <Setup />
            </Grid>
            <Grid className={classes.rates}>
              <ExchangeRates />
            </Grid>
            <Grid>
              <Status />
            </Grid>
          </Grid>
          <Grid
            container
            direction="column"
            className={classes.dataTable}
          >
            <Controls
              onCreateInstance={updateAppContext}
              onTooglePauseInstance={updateAppContext}
              onFinalizeInstance={onFinalizeInstance}
            />
          </Grid>
          <Grid
            container
            direction="column"
            className={classes.dataTable}
          >
            <MakerControls
              onCreateInstance={updateAppContext}
              onTooglePauseInstance={updateAppContext}
              onFinalizeInstance={onFinalizeInstance}
            />
            <ExchangeDataTable />
          </Grid>
        </Grid>
      </div>
    </AppContext.Provider>
  );
}
