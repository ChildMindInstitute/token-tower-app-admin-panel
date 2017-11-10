import React, { Component } from "react";
import {
  Row,
  Col,
  Progress,
  Card,
  CardBlock,
  CardFooter,
  CardTitle,
  Button,
  ButtonToolbar,
  ButtonGroup,
  Label,
  Input,
} from "reactstrap";
import { database } from 'firebase';
import moment from 'moment'
import { BarChart, Bar, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'Recharts';
import { CSVLink, CSVDownload } from 'react-csv';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
  brandDanger, brandInfo, convertHex, dailyLabel, initChartData, mainChartOpts, monthlyLabel, weeklyLabel
} from '../../utils';

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.renderFilterType = this.renderFilterType.bind(this);
    this.onTokenHistoryChanged = this.onTokenHistoryChanged.bind(this);
    this.getChartItemIndex = this.getChartItemIndex.bind(this);
    this.onFilterClick = this.onFilterClick.bind(this);
    this.getTotalAddToken = this.getTotalAddToken.bind(this);
    this.getTotalRemoveToken = this.getTotalRemoveToken.bind(this);
    this.getTotalEarnToken = this.getTotalEarnToken.bind(this);
    this.handleChangeStart = this.handleChangeStart.bind(this);
    this.validateDateChange = this.validateDateChange.bind(this);
    this.handleChangeEnd = this.handleChangeEnd.bind(this);

    this.initData = this.initData.bind(this)

    this.filterTypes = ['Day', 'Week', 'Month']
    this.state = { filterType: 'Day' };

    this.data = [];
  }

  initData() {
    const { isDateChange, state: { filterType, startDate, endDate } } = this;
    if (isDateChange) {
      return [{ name: `From ${startDate.format('MMMM Do YYYY')} to ${endDate.format('MMMM Do YYYY')}`, removed: 0, earned: 0, added: 0 }]
    }

    const filter = filterType === 'Day' ? dailyLabel : filterType === 'Week' ? weeklyLabel : monthlyLabel;
    return filter.map(item => ({ name: item, removed: 0, earned: 0, added: 0 }));
  }

  componentWillMount() {
    database().ref('tokenHistory').on('value', this.onTokenHistoryChanged);
  }

  componentDidUpdate(prevProps, prevState) {
    const { filterType, startDate, endDate } = this.state;
    const isFilterTypeChange = filterType !== prevState.filterType;
    const isStartDateChange = startDate && !startDate.isSame(prevState.startDate);
    const isEndDateChange = endDate && !endDate.isSame(prevState.endDate);
    this.isDateChange = ((isStartDateChange || isEndDateChange) && startDate && endDate);

    if (isFilterTypeChange || this.isDateChange) {
      database().ref('tokenHistory').once('value', this.onTokenHistoryChanged);
    }
  }

  componentWillUnmount() {
    database().ref('tokenHistory').off('value', this.onTokenHistoryChanged);
  }

  getTotalAddToken() {
    return this.data.length > 0 && this.data.reduce((a, b = 0) => a + b.added, 0);
  }

  getTotalRemoveToken() {
    return this.data.length > 0 && Math.abs(this.data.reduce((a, b = 0) => a + b.removed, 0));
  }

  getTotalEarnToken() {
    return this.data.length > 0 && this.data.reduce((a, b = 0) => a + b.added + b.removed, 0);
  }

  getChartItemIndex(timeStamp) {
    const { filterType } = this.state;
    const format = moment(timeStamp).format(filterType === 'Day' ? 'HH:00' : filterType === 'Week' ? 'dddd' : 'DD');
    return (filterType === 'Day' ? dailyLabel : filterType === 'Week' ? weeklyLabel : monthlyLabel).indexOf(format);
  }

  onFilterClick(type) {
    this.setState({ filterType: type });
  }

  onTokenHistoryChanged(parentSnapshot) {
    const { isDateChange, state: { startDate, endDate, filterType }, getChartItemIndex } = this;
    this.data = this.initData();

    let startAt;
    let endAt;

    parentSnapshot.forEach((parent) => {
      if (isDateChange) {
        startAt = moment(startDate).startOf('d').format('x') * 1;
        endAt = moment(endDate).endOf('d').format('x') * 1;
      }
      else {
        const condition = filterType === 'Day' ? 'd' : filterType === 'Week' ? 'w' : 'M';
        startAt = moment().startOf(condition).format('x') * 1;
        endAt = moment().endOf(condition).format('x') * 1;
      }

      parent.ref.orderByChild('timeStamp').startAt(startAt).endAt(endAt).once('value')
        .then((child) => {
          child.forEach((snap) => {
            const { type, timeStamp } = snap.val();
            const index = isDateChange ? 0 : getChartItemIndex(timeStamp);
            const dataItem = this.data[index];
            if (type === 'add') {
              dataItem.added += 1;
            }
            else {
              dataItem.removed -= 1;
            }
            dataItem.earned = dataItem.added + dataItem.removed;
          });
        })
        .then(() => { this.forceUpdate() });
    });
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

  validateDateChange(start, end) {
    if (start && end) {
      if (start.isAfter(end)) {
        alert('from must before to')
        return;
      }
      return true;
    }
    return true;
  }

  handleChangeStart(date) {
    const isValid = this.validateDateChange(date, this.state.endDate)
    if (isValid) this.setState({ startDate: date });
  }

  handleChangeEnd(date) {
    const isValid = this.validateDateChange(this.state.startDate, date)
    if (isValid) this.setState({ endDate: date });
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
                    <CardTitle className="mb-0">Total user tokens</CardTitle>
                    <div className="small text-muted">{moment().format('MMMM Do YYYY')}</div>
                  </Col>
                  <Col sm="7" className="d-none d-sm-inline-block">
                    <CSVLink data={this.data} filename={"my-csv-file.csv"}>
                      <Button color="primary" className="float-right"><i className="icon-cloud-download"></i></Button>
                    </CSVLink>
                    <ButtonToolbar className="float-right" aria-label="Toolbar with button groups">
                      {this.renderFilterType()}
                    </ButtonToolbar>
                    <div>
                      <div className="small text-muted">From</div>
                      <DatePicker
                        selected={this.state.startDate}
                        selectsStart
                        startDate={this.state.startDate}
                        endDate={this.state.endDate}
                        onChange={this.handleChangeStart}
                      />
                      <div className="small text-muted">To</div>
                      <DatePicker
                        selected={this.state.endDate}
                        selectsEnd
                        startDate={this.state.startDate}
                        endDate={this.state.endDate}
                        onChange={this.handleChangeEnd}
                      />
                    </div>
                  </Col>
                </Row>
                <div className="chart-wrapper" style={{ height: 400 + 'px', marginTop: 40 + 'px' }}>
                  <BarChart width={1000} height={400} data={this.data} stackOffset="sign" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={0} stroke='#000' />
                    <Bar dataKey="removed" fill="red" stackId="stack" name="tokens removed" />
                    <Bar dataKey="added" fill="blue" stackId="stack" name="token added" />
                    <Bar dataKey="earned" fill="green" name="tokens earned" />
                  </BarChart>
                </div>
              </CardBlock>
              <CardFooter>
                <ul>
                  <li>
                    <div className="text-muted">Total tokens added</div>
                    <strong>{this.getTotalAddToken()} tokens</strong>
                    <Progress className="progress-xs mt-2" color="primary" value="100" />
                  </li>
                  <li className="d-none d-md-table-cell">
                    <div className="text-muted">Total tokens removed</div>
                    <strong>{this.getTotalRemoveToken()} tokens</strong>
                    <Progress className="progress-xs mt-2" color="danger" value="100" />
                  </li>
                  <li className="d-none d-md-table-cell">
                    <div className="text-muted">Total tokens earned</div>
                    <strong>{this.getTotalEarnToken()} tokens</strong>
                    <Progress className="progress-xs mt-2" color="success" value="100" />
                  </li>
                </ul>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }
}

export default Dashboard;
