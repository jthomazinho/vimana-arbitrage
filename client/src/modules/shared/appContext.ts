import { createContext } from 'react';
import { Data } from './api/bot-instance/interfaces';
import { initialData } from './api/bot-instance/initial-data';

export const AppContext = createContext<Data>(initialData);
