import {
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) => createStyles({
  button: {
    marginLeft: 100,
  },
  loader: {
    color: '#fff',
    marginLeft: 20,
  },
  controls: {
    marginTop: 60,
  },
  status: {
    backgroundColor: 'e0e0e0',
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 80,
  },
  switch: {
    width: 'auto',
    marginRight: 40,
  },
}));

export {
  useStyles,
};
