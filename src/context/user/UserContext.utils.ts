import { useContext } from 'react';
import { UserContext } from './UserContext.context';

export const useUser = () => useContext(UserContext);
