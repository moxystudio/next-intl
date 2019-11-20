import { useContext } from 'react';
import NextIntlContext from './util/context';

const useNextIntl = () => useContext(NextIntlContext);

export default useNextIntl;
