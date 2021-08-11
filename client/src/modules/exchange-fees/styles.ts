import {
  withStyles,
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TextField from '@material-ui/core/TextField';

const StyledTableCell = withStyles((theme: Theme) => createStyles({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
}))(TableCell);

const StyledTextField = withStyles({
  root: {
    '& input': {
      textAlign: 'right',
    },
  },
})(TextField);

const useStyles = makeStyles({
  table: {
    width: '1200px',
    marginBottom: 10,
  },
  button: {
    position: 'relative',
  },
  column: {
    textAlign: 'right',
  },
  loader: {
    color: '#fff',
    marginLeft: 20,
  },
});

export {
  StyledTableCell,
  StyledTextField,
  useStyles,
};
