import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => createStyles({
  icon: (props: { on: boolean }) => ({
    width: 12,
    height: 12,
    backgroundColor: props.on ? 'green' : 'red',
    borderRadius: '50%',
  }),
}));
