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
    backgroundColor: theme.palette.grey['300'],
    color: theme.palette.success.contrastText,
    fontWeight: 'bold',
  },
}))(TableCell);

const StyledTextField = withStyles({
  root: {
    '& input': {
      textAlign: 'right',
    },
  },
})(TextField);

const useStyles = makeStyles((theme: Theme) => createStyles({
  table: {
    width: 'auto',
    marginBottom: 10,
  },
  column: {
    width: 'auto',
    textAlign: 'center',
  },
}));

export {
  StyledTextField,
  StyledTableCell,
  useStyles,
};
