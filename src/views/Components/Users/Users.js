import React, { Component } from "react";
import {
  Badge,
  Row,
  Col,
  Card,
  CardHeader,
  CardBlock,
  Table,
  Pagination,
  PaginationItem,
  PaginationLink
} from "reactstrap";
import { database } from 'firebase';


class Users extends Component {
  constructor() {
    super();
    this.onUserChange = this.onUserChange.bind(this);
    this.renderUserRow = this.renderUserRow.bind(this);

    this.users = [];
  }

  componentWillMount() {
    database().ref('users').on('value', this.onUserChange)
  }

  componentWillUnmount() {
    database().ref('users').off('value', this.onUserChange)
  }

  onUserChange(snapshot) {
    this.users = [];
    snapshot.forEach((childSnapshot) => {
      const { uid, email, displayName, child = {}, parent = {} } = childSnapshot.val();
      const { tokensEarned: childTokensEarned = 0, name: childName } = child;
      const { tokensEarned: parentTokensEarned = 0 } = parent;

      database().ref(`tokenStack/${uid}`).once('value').then((snap) => {
        const { tokens = [] } = snap.val() || {};

        this.users.push({
          uid,
          email,
          displayName,
          childName: childName || 'Don\'t set child name yet',
          tokensEarned: (childName ? childTokensEarned : parentTokensEarned) + tokens.length
        });
      })
        .then(() => this.forceUpdate())
    });
  }

  renderUserRow() {
    return (
      this.users.map(({ uid, email, displayName, childName, tokensEarned }) => (
        <tr key={uid}>
          <td><a href={`#user/${uid}`}>View</a></td>
          <td>{email}</td>
          <td>{displayName}</td>
          <td>{childName}</td>
          <td>{tokensEarned}</td>
        </tr>
      ))
    );
  }

  render() {
    return (
      <div className="animated fadeIn">
        <Row>
          <Col xs="12" lg="12">
            <Card>
              <CardHeader>
                <i className="fa fa-align-justify"></i> Users
              </CardHeader>
              <CardBlock className="card-body">
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Email</th>
                      <th>Display Name</th>
                      <th>Child Name</th>
                      <th>Tokens earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.renderUserRow()}
                  </tbody>
                </Table>
                {
                  // <Pagination>
                  //   <PaginationItem disabled><PaginationLink previous href="#">Prev</PaginationLink></PaginationItem>
                  //   <PaginationItem active>
                  //     <PaginationLink href="#">1</PaginationLink>
                  //   </PaginationItem>
                  //   <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
                  //   <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                  //   <PaginationItem><PaginationLink href="#">4</PaginationLink></PaginationItem>
                  //   <PaginationItem><PaginationLink next href="#">Next</PaginationLink></PaginationItem>
                  // </Pagination>
                }
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </div>

    )
  }
}

export default Users;
