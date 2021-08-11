import React, { useEffect } from 'react';
import { useStyles } from './styles';

interface Props {
  on: boolean;
}

export default function StatusIcon(props: Props) {
  const classes = useStyles(props);
  const [on, setOn] = React.useState(false);

  useEffect(() => {
    setOn(props.on);
  }, [props.on]);

  return <div className={classes.icon} />;
}
