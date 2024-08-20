'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

/////////////////////////////////////////////////
// Data

// DIFFERENT DATA! Contains movement dates, currency and locale

const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-05-27T17:01:17.194Z',
    '2020-07-11T23:36:17.929Z',
    '2020-07-12T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2024-08-19T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2024-08-13T14:43:26.374Z',
    '2024-08-19T18:49:59.371Z',
    '2024-08-18T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

let currentUser;
let sorted = false;
let logoutTimerForCurrentUser;

// format numbers in intl
const formatNumber = function (number, locale, currency) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(number);
};

// logout function

/// logout timer

const beginLogoutTimer = function () {
  const tick = function () {
    const min = String(Math.trunc(time / 60)).padStart(2, 0);
    const sec = String(time % 60).padStart(2, 0);

    labelTimer.textContent = `${min}:${sec}`;

    // stop when become  0 and logout
    if (time === 0) {
      clearInterval(logoutTimerForCurrentUser);

      // update UI with (logout)
      currentUser = undefined;
      sorted = false;
      containerApp.style.opacity = '0';
      // containerApp.style.display = 'none';
      labelWelcome.textContent = 'Log in to get started';
    }
    time--;
  };

  // set still login time
  let time = 60 * 2;

  // update timer
  tick();

  logoutTimerForCurrentUser = setInterval(tick, 1000);
};

const formatMovementDate = function (date) {
  //
  const calcPassedDays = (day1, day2) =>
    Math.trunc(Math.abs(day1 - day2) / (1000 * 60 * 60 * 24));

  // regular expression: day/month/year (using intl)
  const passedDate = new Date(date);
  const options = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  };
  const regularDateEx = new Intl.DateTimeFormat(
    currentUser.locale,
    options
  ).format(passedDate);

  ///regular expression: day/month/year
  // const day = String(passedDate.getDate()).padStart(2, '0');
  // const month = String(passedDate.getMonth() + 1).padStart(2, '0');
  // const year = passedDate.getFullYear();
  // const regularDateEx = `${day}/${month}/${year}`;

  const diff = calcPassedDays(passedDate, new Date());
  //

  return diff === 0
    ? 'Today'
    : diff > 7
    ? regularDateEx
    : diff === 1
    ? 'yesterdat'
    : `${diff} days ago`;
};

const displayMovements = function (acc) {
  containerMovements.innerHTML = '';
  const movements = sorted
    ? acc.movements.slice().sort((a, b) => a - b)
    : acc.movements.slice();

  ///
  movements.forEach(function (mov) {
    //
    const originalIndex = acc.movements.findIndex(move => move === mov);

    const formattedMov = formatNumber(mov, acc.locale, acc.currency);
    // created Dates

    const displayDate = formatMovementDate(acc.movementsDates[originalIndex]);
    //
    const operation = mov > 0 ? 'deposit' : 'withdrawal';
    const html = `
      <div class="movements__row">
          <div class="movements__type movements__type--${operation}">${
      originalIndex + 1
    } ${operation}</div>
          <div class="movements__date">${displayDate}</div>
          <div class="movements__value">${formattedMov}</div>
      </div>
    `;
    //
    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};

const calcDisplayBalance = function (acc) {
  acc.balance = acc.movements.reduce((acc, ele) => acc + ele, 0);
  const formmatedBalance = formatNumber(acc.balance, acc.locale, acc.currency);
  labelBalance.textContent = `${formmatedBalance}`;
};

const computeUserName = function (accs) {
  accs.forEach(function (acc) {
    acc.username = acc.owner
      .toLowerCase()
      .trimStart()
      .trimEnd()
      .split(' ')
      .map(n => n[0])
      .join('');
  });
};

const calcDisplaySummary = function (acc) {
  // reduce the summary with chaning feature
  const income = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);

  const outcome = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);

  const interest = acc.movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * acc.interestRate) / 100)
    .reduce((acc, mov) => acc + mov, 0);

  /// format summeries in intl
  const formatIncome = formatNumber(+income, acc.locale, acc.currency);
  const formatOutcome = formatNumber(-+outcome, acc.locale, acc.currency);
  const formatInterest = formatNumber(+interest, acc.locale, acc.currency);
  //diplay the results
  labelSumIn.textContent = `${formatIncome}`;
  labelSumOut.textContent = `${formatOutcome}`;
  labelSumInterest.textContent = `${formatInterest}`;
};

btnLogin.addEventListener('click', function (e) {
  e.preventDefault();
  sorted = false;
  currentUser = accounts.find(acc => acc.username === inputLoginUsername.value);
  if (currentUser?.pin === +inputLoginPin.value) {
    // display message
    labelWelcome.textContent = `Welcome back,${
      currentUser.owner.split(' ')[0]
    }`;
    // cleat the input field
    inputLoginPin.value = '';
    inputLoginUsername.value = '';

    // display all app
    containerApp.style.opacity = '1';
    // containerApp.style.display = 'grid';

    // clear prevoius user logout timer if exist
    if (logoutTimerForCurrentUser) clearInterval(logoutTimerForCurrentUser);

    // start logout timer for current user
    beginLogoutTimer();

    // update Ui
    updateUI();

    //
    const now = new Date();
    const locale = currentUser.locale;
    const options = {
      day: 'numeric',
      hour: 'numeric',
      year: 'numeric',
      month: 'long',
      weekday: 'long',
      minute: 'numeric',
    };
    // update time with intl
    labelDate.textContent = new Intl.DateTimeFormat(locale, options).format(
      now
    );
    // update time
    // const day = String(now.getDate()).padStart(2, '0');
    // const month = String(now.getMonth() + 1).padStart(2, '0');
    // const year = now.getFullYear();
    // const hour = String(now.getHours() % 12).padStart(2, 0);
    // const minutes = String(now.getMinutes()).padStart(2, 0);
    // labelDate.textContent = `${day}/${month}/${year}, ${hour}:${minutes}`;
  }
});

const updateUI = function () {
  // display movements
  displayMovements(currentUser);

  // display summary
  calcDisplaySummary(currentUser);

  // dispaly balance
  calcDisplayBalance(currentUser);
};

btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  const recieverAcc = accounts.find(
    acc => acc.username === inputTransferTo.value
  );
  const amount = +inputTransferAmount.value;
  if (
    recieverAcc &&
    !isNaN(amount) &&
    amount > 0 &&
    amount <= currentUser.balance &&
    recieverAcc?.username !== currentUser.username
  ) {
    const now = new Date();
    // add mov to reciever and its time

    recieverAcc.movements.push(amount);
    recieverAcc.movementsDates.push(now.toISOString());

    // add mov to currentUser and its time
    currentUser.movements.push(-amount);
    currentUser.movementsDates.push(now.toISOString());

    // claer input field
    inputTransferTo.value = '';
    inputTransferAmount.value = '';

    // update Ui
    updateUI();

    // reset timer
    if (logoutTimerForCurrentUser) clearInterval(logoutTimerForCurrentUser);
    beginLogoutTimer();
  }
});

btnLoan.addEventListener('click', function (e) {
  e.preventDefault();
  const loanAmout = Math.floor(inputLoanAmount.value);
  if (currentUser.movements.some(mov => mov > 0 && mov >= loanAmout * 0.1)) {
    setTimeout(function () {
      // add mov
      currentUser.movements.push(loanAmout);
      //add move time
      currentUser.movementsDates.push(new Date().toISOString());
      // update UI
      updateUI();
    }, 3000);
    // clear input field
    inputLoanAmount.value = '';

    // reset timer
    beginLogoutTimer();
  }
});

btnClose.addEventListener('click', function (e) {
  e.preventDefault();
  const username = inputCloseUsername.value;
  const password = +inputClosePin.value;
  if (username === currentUser.username && password === currentUser.pin) {
    accounts.splice(
      accounts.findIndex(acc => acc.username === username),
      1
    );
    //clear input fiels
    inputCloseUsername.value = inputCloseUsername.value = '';
    // logout
    containerApp.style.opacity = '0';
    // containerApp.style.display = 'none';
    // login message
    labelWelcome.textContent = 'Log in to get started';
    currentUser = undefined;
  }
});

computeUserName(accounts);

btnSort.addEventListener('click', function (e) {
  e.preventDefault();
  sorted = !sorted;
  displayMovements(currentUser);
});

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// LECTURES
