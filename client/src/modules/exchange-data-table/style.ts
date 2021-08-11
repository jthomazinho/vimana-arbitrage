import {
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) => createStyles({
  fetchCycleInfo: {
    marginBottom: 10,
  },
  table: {
    flexWrap: 'nowrap',
    width: '2300px',
  },
}));

export {
  useStyles,
};
