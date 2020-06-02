import { DEVPORTAL_ERRORS_URL } from '../constants';
import errors from './errors.json';
import { ErrorDictionary } from '../types';
import { Lang } from '../types/enums';

export default class extends Error {
  ref: string;

  id: string;

  constructor(errorId: string, lang = Lang.en) {
    let error = (errors as ErrorDictionary)[errorId];
    if (!error) {
      error = {
        id: 'KB000',
        message: {
          en: 'Unknown error',
          es: 'Error desconocido',
          ja: '不明なエラー',
          ko: '알수없는 오류',
          pt: 'Erro desconhecido',
          ru: 'Неизвестная ошибка',
          zh: '未知错误',
        },
      };
    }

    super(error.message[lang]);
    this.id = error.id;
    this.ref = `${DEVPORTAL_ERRORS_URL}#${error.id.toLowerCase()}`;
  }
}
