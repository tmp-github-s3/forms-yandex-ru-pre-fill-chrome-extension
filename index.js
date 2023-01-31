// ==UserScript==
// @name         pre-fill for forms.yandex.ru
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  try to take over the world!
// @author       You
// @match        https://forms.yandex.ru/surveys/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

// TODO: если какой-то селектор не сработал говорить об этом
// TODO: добавить typescript

(function() {
  'use strict';

  // constants {

  const LOCAL_STORAGE_KEY_QAS = 'lastQas';


  const localStorageQas = localStorage.getItem(LOCAL_STORAGE_KEY_QAS);
  const qas = localStorageQas ? JSON.parse(localStorageQas) : [];

  const checkIsMobile = () => document.querySelector("head > meta[name=apple-mobile-web-app-capable]")?.content === 'yes';

  const getDesktopWelcomeTitle = () => document.querySelector("body > div.b-page__content > div > div.survey-header > div > h1");
  const getMobileWelcomeTitle = () => document.querySelector("body > div.b-page__content > div > div.survey-header > div > h3");
  const getWelcomeTitle = checkIsMobile() ? getMobileWelcomeTitle : getDesktopWelcomeTitle;
  const welcomeTitleText = 'Ultima';

  const getDesktopWelcomeContent = () => document.querySelector("body > div.b-page__content > div > div.survey-wrap > form > div.survey__section > div.survey__page.survey__page_page_1.survey__page_visible_yes > fieldset > div.survey__question.survey-question.survey-question_name_answer_statement_10283530.survey-question_widget_statement.i-bem.survey-question_js_inited > div > table > tbody > tr:nth-child(1) > td.survey__label > label > div");
  const getMobileWelcomeContent = () => document.querySelector("body > div.b-page__content > div > div.survey-wrap > form > div.survey__section > div.survey__page.survey__page_page_1.survey__page_visible_yes > fieldset > div.survey__question.survey-question.survey-question_name_answer_statement_10283530.survey-question_widget_statement.i-bem.survey-question_js_inited > div > div > div > label > div > p");
  const getWelcomeContent = checkIsMobile() ? getMobileWelcomeContent : getDesktopWelcomeContent;
  const welcomeContentText = 'Привет! 👋🏻 Вы тайный покупатель, не забывайте важные вещи:'

  const getWelcomeButton = () => document.querySelector("body > div.b-page__content > div > div.survey-wrap > form > div.survey__submit-button > button.button.button_theme_action.button_size_m.button_role_next.i-bem.button_js_inited");
  const welcomeButtonText = 'Далее';

  const getDesktopTitle = () => document.querySelector("body > div.b-page__content > div > div.survey-header > div > h1");
  const getMobileTitle = () => document.querySelector("body > div.b-page__content > div > div.survey-header > div > h3");
  const getTitle = checkIsMobile() ? getMobileTitle : getDesktopTitle;
  const titleText = 'Ultima';

  const getDesktopReminder = () => document.querySelector("body > div.b-page__content > div > div.survey-wrap > form > div.survey__section > div.survey__page.survey__page_page_2.survey__page_visible_yes > fieldset > div.survey__question.survey-question.survey-question_name_answer_statement_10477747.survey-question_widget_statement.i-bem.survey-question_js_inited > div > table > tbody > tr:nth-child(1) > td.survey__label > label > div");
  const getMobileReminder = () => document.querySelector("body > div.b-page__content > div > div.survey-wrap > form > div.survey__section > div.survey__page.survey__page_page_2.survey__page_visible_yes > fieldset > div.survey__question.survey-question.survey-question_name_answer_statement_10477747.survey-question_widget_statement.i-bem.survey-question_js_inited > div > div > div > label > div > p");
  const reminderText = 'Если захотите повторить стандарты премиальных тарифов Ultima, найдёте их здесь';
  const getReminder = checkIsMobile() ? getMobileReminder : getDesktopReminder;

  // constants }

  // utils {

  const log = alert;

  class Logger {
    output =  '';

    append = (string) => {
      this.output += string + '\n';
    }

    show = () => {
      log(this.output);
      this.output = '';
    }

    showIfNeed = () => {
      if (this.output) {
        this.show();
      }
    }
  }

  const logger = new Logger();

  const checkFabric = (getChecks) => () => {
    for (const [check, value] of Object.entries(getChecks())) {
      if (!value) {
        logger.append(`!${check}`)
        return false;
      }
    }
    return true;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  const findElementByText = (text, parent = document) => {
    const nodes = Array.from(parent?.querySelectorAll?.('*') || []);
    for (const node of nodes) {
      if (node.innerText === text) {
        return node;
      }
    }
  }

  const getQuestionNode = (child) => {
    const finishElement = document.body;
    let currentElement = child;
    while (currentElement && currentElement !== finishElement){
      if (currentElement.classList.contains('survey-question')) {
        return currentElement;
      }
      currentElement = currentElement.parentElement;
    }
    return false;
  }

  const answerQuestion = (question, answer) => {
    const questionNode = getQuestionNode(
      findElementByText(question)
    );

    let clickableNode;
    if (questionNode.classList.contains('survey-question_widget_radio-list')) {
      const radiobox = questionNode.querySelector('.radiobox');
      if ([...radiobox.childNodes].find(label => label.classList.contains('radiobox__radio_checked_yes'))) {
        return;
      }
      clickableNode = findElementByText(
        answer,
        radiobox
      );
    } else if (questionNode.classList.contains('survey-question_widget_checkbox')) {
      const checkbox = questionNode.querySelector('.checkbox');
      if (checkbox.classList.contains('checkbox_checked_yes')) {
        return;
      }
      clickableNode = checkbox.querySelector('.checkbox__control');
    }

    if (clickableNode) {
      console.log('clickableNode', clickableNode);
      clickableNode.click();
    } else {
      logger.append(`${question}, ${answer}`);
    }
  }

  const getLabelTextFromRadioboxQuestionNode = (questionNode) =>
    questionNode
      .querySelector('.survey__label')
      .querySelector('.safe-content')
      .innerText;

  const getRadioboxesCheckedYes = () => document.querySelectorAll('.radiobox__radio_checked_yes');
  const getRadioboxQas = () => [...getRadioboxesCheckedYes()].map(radiobox => ({
    question: getLabelTextFromRadioboxQuestionNode(getQuestionNode(radiobox)),
    answer: radiobox.innerText,
  }));

  const getCheckboxesCheckedYes = () => document.querySelectorAll('.checkbox_checked_yes');
  const getCheckboxQas = () => [...getCheckboxesCheckedYes()].map(checkbox => ({
    question: checkbox.innerText,
    answer: checkbox.innerText,
  }));

  const saveQasToLocalStorage = () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_QAS,
      JSON.stringify(
        [
          ...getCheckboxQas(),
          ...getRadioboxQas(),
        ]
      )
    );
  }


  // utils }

  // globals {

  window.saveQasToLocalStorage = saveQasToLocalStorage;

  // globals }

  // business logic {

  const checkIsWelcomePage = checkFabric(() =>({
    isWelcomeTitle: getWelcomeTitle()?.innerText.includes(welcomeTitleText),
    isWelcomeContent: getWelcomeContent()?.innerText.includes(welcomeContentText),
    isWelcomeButton: getWelcomeButton()?.innerText.includes(welcomeButtonText),
  }))

  const checkIsMainPage = checkFabric(() => ({
    isTitle: getTitle()?.innerText.includes(titleText),
    isReminder: getReminder()?.innerText.includes(reminderText),
  }));

  const answerQuestions = async () => {
    for (const {question, answer} of qas) {
      await sleep(randomIntFromInterval(10, 100));
      answerQuestion(question, answer);
    }
  }

  let answerTheQuestionsTimeout = 0;
  if (checkIsWelcomePage()) {
    getWelcomeButton()?.click();
    answerTheQuestionsTimeout = 500;
  }

  setTimeout(async () => {
    if (checkIsMainPage()) {
      await answerQuestions();
    }
    logger.showIfNeed();
  }, answerTheQuestionsTimeout)

  // business logic }

  // ui {

  const createSaveButton = () => {
    const button = document.createElement('button');
    button.innerHTML = 's';
    button.style.position = 'fixed';
    button.style.zIndex = '99999';
    button.style.width = '30px';
    button.style.height = '30px';
    button.onclick = saveQasToLocalStorage;
    document.body.appendChild(button);
  }

  createSaveButton();

  // ui }

  // css styles {

  function addCss(cssCode) {
    var styleElement = document.createElement("style");
    styleElement.type = "text/css";
    if (styleElement.styleSheet) {
      styleElement.styleSheet.cssText = cssCode;
    } else {
      styleElement.appendChild(document.createTextNode(cssCode));
    }
    document.getElementsByTagName("head")[0].appendChild(styleElement);
  }
  var css = `
.survey__group {
  display: flex;
  flex-direction: column;
}
`
  addCss(css);

  const nodeTextsOrder = [
    'По окончании поездки водитель предложил открыть или открыл дверь?',
    'Водитель встретил вас у двери перед поездкой и открыл дверь или предложил открыть её?',
    'Водитель помог с багажом?',
    'Спрашивал ли водитель что-то кроме пожеланий по поездке?',
    'Водитель одет по дресс-коду?',
    'Подлокотник на заднем сиденье был',
    'В салоне есть посторонние предметы?',
    'В салоне есть зарядка для телефона на видном месте?',
    'В автомобиле есть бутылка воды для пассажира на видном месте?',
    'Слышали ли вы голосовые подсказки навигации и прочие звуки мобильных устройств?',
    'Водитель вежлив и приветлив?',
    'Водитель был отзывчив?',
    'Водитель отвлекался на телефон?',
    'Оцените манеру вождения',
    'Приложите фото или видео из салона, на котором виден дресс-код водителя. Идеально, если будет видно, пристегнулся ли водитель',
  ]

  for (const [i, nodeText] of nodeTextsOrder.entries()) {
    const attachPhotoNode = getQuestionNode(findElementByText(nodeText));
    attachPhotoNode.style.order = i + 1;
  }

  // css styles }
})();
