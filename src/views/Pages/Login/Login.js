import React, { Component } from "react";
import { Container, Row, Col, CardGroup, Card, CardBlock, Button, Input, InputGroup, InputGroupAddon } from "reactstrap";
import { auth, database } from 'firebase';

class Login extends Component {
  constructor() {
    super();
    this.onLogin = this.onLogin.bind(this);
    this.onUsernamChange = this.onUsernamChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);

    this.state = {
      username: undefined,
      password: undefined
    }
  }

  onLogin() {
    const { username, password } = this.state;
    const { history } = this.props;
    auth().signInWithEmailAndPassword(username, password)
      .then(({ uid }) => database().ref(`users/${uid}`).once('value'))
      .then((snap) => {
        const { isAdmin } = snap.val();
        if (isAdmin) history.push(('/'));
        else throw new Error();
      })
      .catch(() => alert('username or password incorrect'));
  }

  onUsernamChange({ target: { value } }) {
    this.setState({ username: value })
  }

  onPasswordChange({ target: { value } }) {
    this.setState({ password: value })
  }

  render() {
    return (
      <div className="app flex-row align-items-center">
        <Container>
          <Row className="justify-content-center">
            <Col md="8">
              <CardGroup className="mb-0">
                <Card className="p-4">
                  <CardBlock className="card-body">
                    <h1>Login</h1>
                    <p className="text-muted">Sign In to your account</p>
                    <InputGroup className="mb-3">
                      <InputGroupAddon><i className="icon-user"></i></InputGroupAddon>
                      <Input type="text" placeholder="email" value={this.state.username} onChange={this.onUsernamChange} />
                    </InputGroup>
                    <InputGroup className="mb-4">
                      <InputGroupAddon><i className="icon-lock"></i></InputGroupAddon>
                      <Input type="password" placeholder="Password" value={this.state.password} onChange={this.onPasswordChange} />
                    </InputGroup>
                    <Row>
                      <Col xs="6">
                        <Button color="primary" className="px-4" onClick={this.onLogin}>Login</Button>
                      </Col>
                    </Row>
                  </CardBlock>
                </Card>
              </CardGroup>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Login;
