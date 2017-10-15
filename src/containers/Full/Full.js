import React, { Component } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { Container } from 'reactstrap';
import { auth } from 'firebase';

import Header from '../../components/Header/';
import Sidebar from '../../components/Sidebar/';
import Breadcrumb from '../../components/Breadcrumb/';
import Aside from '../../components/Aside/';
import Footer from '../../components/Footer/';
import Dashboard from '../../views/Dashboard/';

import UserChart from '../../views/UserChart/UserChart';
import Users from '../../views/Components/Users/Users';

class Full extends Component {
  constructor() {
    super();

    this.onAuthStateChanged = this.onAuthStateChanged.bind(this);
  }

  componentWillMount() {
    auth().onAuthStateChanged(this.onAuthStateChanged);
  }

  onAuthStateChanged(user) {
    if (!user) {
      this.props.history.push('/login')
    }
  }

  render() {
    return (
      <div className="app">
        <Header />
        <div className="app-body">
          <Sidebar {...this.props} />
          <main className="main">
            <Breadcrumb />
            <Container fluid>
              <Switch>
                <Route path="/dashboard" name="Dashboard" component={Dashboard} />
                <Route path="/users" name="Users" component={Users} />
                <Route path="/user/:id" name="User" component={UserChart} />
                <Redirect from="/" to="/dashboard" />
              </Switch>
            </Container>
          </main>
          <Aside />
        </div>
        <Footer />
      </div>
    );
  }
}

export default Full;
