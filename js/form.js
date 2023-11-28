import { resetScale } from './scale.js';
import { init as initEffect, reset as resetEffect } from './effects.js';
import { sendPictures } from './api.js';
import { showSuccessMessage, showErrorMessage } from './message.js';
import { isEscapeKey } from './util.js';

const MAX_HASHTAG_COUNT = 5;
const VALID_HASHTAG = /^#[a-zа-яё0-9]{1,19}$/i;
const textError = {
  INVALID_COUNT: `Количество введенных хэштегов должно быть не больше ${MAX_HASHTAG_COUNT}.`,
  NOT_UNIQUE: 'Хэштеги не могут повторяться',
  INVALID_PATTERN: 'Некорректный хештег',
};

const submitButtonCaption = {
  SUBMITTING: 'Отправляю...',
  IDLE: 'Опубликовать',
};

const body = document.querySelector('body');
const formUpload = document.querySelector('.img-upload__form');
const formOverlay = formUpload.querySelector('.img-upload__overlay');
const closeButton = formUpload.querySelector('.img-upload__cancel');
const fileUploadField = formUpload.querySelector('.img-upload__input');
const hashtagsField = formUpload.querySelector('.text__hashtags');
const commentsField = formUpload.querySelector('.text__description');
const submitButton = formUpload.querySelector('.img-upload__submit');


const toggleSubmitButton = (isDisabled) => {
  submitButton.disabled = isDisabled;
  if (isDisabled) {
    submitButton.textContent = submitButtonCaption.SUBMITTING;
  } else {
    submitButton.textContent = submitButtonCaption.IDLE;
  }
};

const pristine = new Pristine(formUpload, {
  classTo: 'img-upload__field-wrapper',
  errorTextParent: 'img-upload__field-wrapper',
  errorTextClass: 'img-upload__field-wrapper--error',
});

const openModalForm = () => {
  formOverlay.classList.remove('hidden');
  body.classList.add('modal-open');
  document.addEventListener('keydown', onDocumentKeydown);
};

const closeModalForm = () => {
  formUpload.reset();
  resetScale();
  resetEffect();
  pristine.reset();
  formOverlay.classList.add('hidden');
  body.classList.remove('modal-open');
  document.removeEventListener('keydown', onDocumentKeydown);
};

const isTextFieldFocused = () =>
  document.activeElement === hashtagsField ||
  document.activeElement === commentsField;

const normalizeTags = (tagString) => tagString
  .trim()
  .split(' ')
  .filter((tag) => Boolean(tag.length));

const hasValidTags = (value) => normalizeTags(value).every((tag) => VALID_HASHTAG.test(tag));

const hasValidCount = (value) => normalizeTags(value).length <= MAX_HASHTAG_COUNT;

const hasUniqueTags = (value) => {
  const lowerCaseTags = normalizeTags(value).map((tag) => tag.toLowerCase());
  return lowerCaseTags.length === new Set(lowerCaseTags).size;
};

const isErrorMessageExists = () => Boolean(document.querySelector('.error'));

const onDocumentKeydown = (evt) => {
  if (isEscapeKey(evt) && !isTextFieldFocused() && !isErrorMessageExists()) {
    evt.preventDefault();
    closeModalForm();
  }
};

const onCloseButtonClick = () => {
  closeModalForm();
};

const onFileInputChange = () => {
  openModalForm();
};

const sendForm = async (formElement) => {
  if (!pristine.validate()) {
    return;
  }

  try {
    toggleSubmitButton(true);
    await sendPictures(new FormData(formElement));
    toggleSubmitButton(false);
    closeModalForm();
    showSuccessMessage();
  } catch {
    showErrorMessage();
    toggleSubmitButton(false);
  }

};

const onFormSubmit = (evt) => {
  evt.preventDefault();
  sendForm(evt.target);
};

pristine.addValidator(
  hashtagsField,
  hasValidCount,
  textError.INVALID_COUNT,
  3,
  true
);

pristine.addValidator(
  hashtagsField,
  hasUniqueTags,
  textError.NOT_UNIQUE,
  2,
  true
);

pristine.addValidator(
  hashtagsField,
  hasValidTags,
  textError.INVALID_PATTERN,
  1,
  true
);

formUpload.addEventListener('submit', onFormSubmit);
fileUploadField.addEventListener('change', onFileInputChange);
closeButton.addEventListener('click', onCloseButtonClick);
initEffect();
