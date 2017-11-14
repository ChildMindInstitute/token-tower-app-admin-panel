import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { initializeApp, auth } from 'firebase';

// Styles
// Import Font Awesome Icons Set
import 'font-awesome/css/font-awesome.min.css';
// Import Simple Line Icons Set
import 'simple-line-icons/css/simple-line-icons.css';
// Import Main styles for this application
import '../scss/style.scss'

// Containers
import Full from './containers/Full/'

// Views
import Login from './views/Pages/Login/'
import Register from './views/Pages/Register/'
import Page404 from './views/Pages/Page404/'
import Page500 from './views/Pages/Page500/'

const history = createBrowserHistory();

initializeApp({
  apiKey: 'AIzaSyD75oo04itTTic2KSkS2_q32_fj9YCke9k',
  authDomain: 'token-e7f83.firebaseapp.com',
  databaseURL: 'https://token-e7f83.firebaseio.com',
  projectId: 'token-e7f83',
  storageBucket: 'token-e7f83.appspot.com',
  messagingSenderId: '211351537237'
});

ReactDOM.render((
  <HashRouter history={history}>
    <Switch>
      <Route exact path="/login" name="Login Page" component={Login} />
      <Route exact path="/404" name="Page 404" component={Page404} />
      <Route exact path="/500" name="Page 500" component={Page500} />
      <Route path="/" name="Home" component={Full} />
    </Switch>
  </HashRouter>
), document.getElementById('root'));
