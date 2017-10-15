import React, { Component } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Row,
  Col,
  Progress,
  Card,
  CardBlock,
  CardFooter,
  CardTitle,
  ButtonToolbar,
  ButtonGroup,
  Label,
  Input,
} from "reactstrap";
import { database } from 'firebase';
import moment from 'moment'
import {
  brandDanger, brandInfo, convertHex, dailyLabel, initChartData, mainChartOpts, monthlyLabel, weeklyLabel
} from '../../utils';

class UserChart extends Component {
  constructor(props) {
    super(props);

    this.renderFilterType = this.renderFilterType.bind(this);
    this.onTokenHistoryChanged = this.onTokenHistoryChanged.bind(this);
    this.onUserChanged = this.onUserChanged.bind(this);
    this.getChartData = this.getChartData.bind(this);
    this.getChartItemIndex = this.getChartItemIndex.bind(this);
    this.onFilterClick = this.onFilterClick.bind(this);
    this.getTotalAddToken = this.getTotalAddToken.bind(this);
    this.getTotalRemoveToken = this.getTotalRemoveToken.bind(this);
    this.getTotalTokenEarned = this.getTotalTokenEarned.bind(this);

    this.addTokenActivities = [];
    this.removeTokenActivities = [];
    this.tokensEarnedAverage = [];

    this.filterTypes = ['Day', 'Week', 'Month']
    this.state = { filterType: 'Day' };
  }

  componentWillMount() {
    const { match: { params: { id } } } = this.props;
    database().ref(`tokenHistory/${id}`).on('value', this.onTokenHistoryChanged);
    database().ref(`users/${id}`).on('value', this.onUserChanged);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.filterType !== prevState.filterType) {
      const { match: { params: { id } } } = this.props;
      database().ref(`tokenHistory/${id}`).once('value', this.onTokenHistoryChanged);
    }
  }

  componentWillUnmount() {
    const { match: { params: { id } } } = this.props;
    database().ref(`tokenHistory/${id}`).off('value', this.onTokenHistoryChanged);
    database().ref(`users/${id}`).off('value', this.onUserChanged);
  }

  onUserChanged(childSnapshot) {
    const { displayName } = childSnapshot.val();
    this.setState({ displayName })
  }

  getChartData() {
    const { state: { filterType }, addTokenActivities, removeTokenActivities, tokensEarnedAverage } = this;

    return initChartData(
      [...addTokenActivities],
      [...removeTokenActivities],
      [...tokensEarnedAverage],
      filterType === 'Day' ? dailyLabel : filterType === 'Week' ? weeklyLabel : monthlyLabel
    );
  }

  getChartItemIndex(timeStamp) {
    const { filterType } = this.state;
    const format = moment(timeStamp).format(filterType === 'Day' ? 'HH:00' : filterType === 'Week' ? 'dddd' : 'DD');
    return (filterType === 'Day' ? dailyLabel : filterType === 'Week' ? weeklyLabel : monthlyLabel).indexOf(format);
  }

  onFilterClick(type) {
    this.setState({ filterType: type });
  }

  getTotalAddToken() {
    return this.addTokenActivities.length > 0 && this.addTokenActivities.reduce((a, b) => a + b);
  }

  getTotalRemoveToken() {
    return this.removeTokenActivities.length > 0 && this.removeTokenActivities.reduce((a, b) => a + b);
  }

  getTotalTokenEarned() {
    return this.getTotalAddToken() - this.getTotalRemoveToken();
  }

  onTokenHistoryChanged(snapshot) {
    this.addTokenActivities = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.removeTokenActivities = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.tokensEarnedAverage = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const { state: { filterType }, addTokenActivities, removeTokenActivities, getChartItemIndex, tokensEarnedAverage } = this;
    const condition = filterType === 'Day' ? 'd' : filterType === 'Week' ? 'w' : 'M';
    const startAt = moment().startOf(condition).format('x') * 1;
    const endAt = moment().endOf(condition).format('x') * 1;

    snapshot.ref.orderByChild('timeStamp').startAt(startAt).endAt(endAt).once('value')
      .then((child) => {
        child.forEach((snap) => {
          const { type, timeStamp } = snap.val();
          const index = getChartItemIndex(timeStamp);
          const activies = (type === 'add' ? addTokenActivities : removeTokenActivities);
          activies[index] += 1;
          tokensEarnedAverage[index] = addTokenActivities[index] - removeTokenActivities[index];
        });
      })
      .then(() => { this.forceUpdate() });
  }

  renderFilterType() {
    const { filterTypes, state: { filterType } } = this;

    return (
      <ButtonGroup className="mr-3" data-toggle="buttons" aria-label="First group">
        {
          filterTypes.map(type => (
            <Label htmlFor={type} className={`btn btn-outline-secondary ${type === filterType && 'active'}`} key={type}>
              <Input type="radio" name={type} id={type} onClick={() => { this.onFilterClick(type); }} />{type}
            </Label>
          ))
        }
      </ButtonGroup>
    )
  }
  render() {
    return (
      <div className="animated fadeIn">
        <Row>
          <Col>
            <Card>
              <CardBlock className="card-body">
                <Row>
                  <Col sm="5">
                    <CardTitle className="mb-0">{this.state.displayName}'s activies</CardTitle>
                    <div className="small text-muted">{moment().format('MMMM Do YYYY')}</div>
                  </Col>
                  <Col sm="7" className="d-none d-sm-inline-block">
                    <ButtonToolbar className="float-right" aria-label="Toolbar with button groups">
                      {this.renderFilterType()}
                    </ButtonToolbar>
                  </Col>
                </Row>
                <div className="chart-wrapper" style={{ height: 300 + 'px', marginTop: 40 + 'px' }}>
                  <Line data={this.getChartData()} options={mainChartOpts} height={300} />
                </div>
              </CardBlock>
              <CardFooter>
                <ul>
                  <li>
                    <div className="text-muted">Total tokens added</div>
                    <strong>{this.getTotalAddToken()} times</strong>
                    <Progress className="progress-xs mt-2" color="info" value="100" />
                  </li>
                  <li className="d-none d-md-table-cell">
                    <div className="text-muted">Total tokens removed</div>
                    <strong>{this.getTotalRemoveToken()} times</strong>
                    <Progress className="progress-xs mt-2" color="danger" value="100" />
                  </li>
                  <li className="d-none d-md-table-cell">
                    <div className="text-muted">Total tokens earned</div>
                    <strong>{this.getTotalTokenEarned()} Tokens</strong>
                    <Progress className="progress-xs mt-2" color="success" value="100" />
                  </li>
                </ul>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default UserChart;
