import {
  withStyles,
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';

const StyledTableCell = withStyles((theme: Theme) => createStyles({
  head: {
    backgroundColor: theme.palette.grey['400'],
    color: theme.palette.common.black,
    fontWeight: 'bold',
  },
}))(TableCell);

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
  StyledTableCell,
  useStyles,
};
