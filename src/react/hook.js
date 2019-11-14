import { useContext } from 'react';
import NextIntlContext from './context';

const useNextIntl = () => useContext(NextIntlContext);

export default useNextIntl;
