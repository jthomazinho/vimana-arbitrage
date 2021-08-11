import {
  withStyles,
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';

const StyledTableCell = withStyles((theme: Theme) => createStyles({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    position: 'relative',
    '& div': {
      display: 'inline-block',
      marginLeft: 8,
    },
  },

}))(TableCell);

const StyledTooltip = makeStyles((theme) => ({
  arrow: {
    color: theme.palette.common.black,
  },
  tooltip: {
    backgroundColor: theme.palette.common.black,
    fontSize: 12,
  },
}));

const useStyles = makeStyles((theme: Theme) => createStyles({
  table: {
    width: 500,
    marginLeft: 20,
    marginTop: 40,
    marginBottom: 10,
  },
  customCell: {
    padding: '0 8px',
  },
  customCellColored: {
    backgroundColor: '#80808054',
  },
  priceInfos: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    border: 0,
    '& div b': {
      marginRight: 4,
    },
    '& div + div': {
      marginLeft: 10,
    },
  },
}));

export {
  StyledTableCell,
  StyledTooltip,
  useStyles,
};
