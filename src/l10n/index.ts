import { LANGCODE } from '../constants';
import { en } from './en';
import { ua } from './ua';

export type WORD = keyof typeof en;

export const createT: (arg: LANGCODE) => (stg: WORD) => string = (lang) => {
    const codes = {
        en,
        ua
    };
    return (word) => {
        return codes?.[lang]?.[word] || word;
    };
};
