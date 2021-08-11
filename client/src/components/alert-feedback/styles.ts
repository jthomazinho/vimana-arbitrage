import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles(() => ({
  inline: {
    flexDirection: 'row',
    '& div': {
      flexDirection: 'inherit',
    },
  },
  message: {
    wordBreak: 'break-word',
    whiteSpace: 'pre-line',
  },
}));
