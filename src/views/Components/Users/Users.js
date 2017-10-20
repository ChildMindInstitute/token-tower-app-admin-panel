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
  PaginationLink,
  FormGroup,
  InputGroup,
  InputGroupAddon,
  Input,
  InputGroupButton,
  Button
} from "reactstrap";
import { database } from 'firebase';


class Users extends Component {
  constructor() {
    super();
    this.onUserChange = this.onUserChange.bind(this);
    this.renderUserRow = this.renderUserRow.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onSeeMore = this.onSeeMore.bind(this);
    this.pageLengh = 50;
    this.users = [];
    this.state = {
      searchText: undefined
    }
  }

  componentWillMount() {
    database().ref('users').limitToFirst(this.pageLengh).once('value', this.onUserChange)
  }

  onSearchChange({ target: { value } }) {
    this.setState({ searchText: value })
  }

  onSearch() {
    database().ref('users').once('value', this.onUserChange)
  }

  onSeeMore() {
    const { users } = this;
    database().ref('users').orderByKey().limitToFirst(this.pageLengh + 1).startAt(users[users.length - 1].uid)
      .once('value', (snapshot) => {
        this.onUserChange(snapshot, true)
      })
  }

  onUserChange(snapshot, isSeeMore) {
    if (isSeeMore) this.users.pop();
    else this.users = [];
    snapshot.forEach((childSnapshot) => {
      const { uid, email, displayName, child = {}, parent = {} } = childSnapshot.val();
      const { tokensEarned: childTokensEarned = 0, name: childName = '' } = child;
      const { tokensEarned: parentTokensEarned = 0 } = parent;
      const { searchText } = this.state;

      if (searchText != null
        && !email.includes(searchText)
        && !displayName.includes(searchText)
        && !childName.includes(searchText)) {
        this.forceUpdate();
        return;
      }

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
                <FormGroup row>
                  <Col md="12">
                    <InputGroup>
                      <InputGroupButton>
                        <Button color="primary" onClick={this.onSearch}><i className="fa fa-search"></i> Search</Button>
                      </InputGroupButton>
                      <Input
                        type="text" id="input1-group2"
                        name="input1-group2" placeholder="Search"
                        value={this.state.searchText}
                        onChange={this.onSearchChange} />
                    </InputGroup>
                  </Col>
                </FormGroup>
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
                <Button onClick={this.onSeeMore} color="primary"><i className="fa fa-caret-square-o-down"></i>{'\u00A0'} See more</Button>
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
