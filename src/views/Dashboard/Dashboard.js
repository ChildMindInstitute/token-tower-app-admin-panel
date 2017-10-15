import React, { Component } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Badge,
  Row,
  Col,
  Progress,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
  CardHeader,
  CardBlock,
  CardFooter,
  CardTitle,
  Button,
  ButtonToolbar,
  ButtonGroup,
  ButtonDropdown,
  Label,
  Input,
  Table
} from "reactstrap";
import { database } from 'firebase';
import moment from 'moment'

const brandInfo = '#63c2de';
const brandDanger = '#f86c6b';

// convert Hex to RGBA
function convertHex(hex, opacity) {
  hex = hex.replace('#', '');
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);

  var result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
  return result;
}

const dailyLabel = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
const weeklyLabel = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];
const monthlyLabel = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31',
];

const initChartData = (addTokenActivities, removeTokenActivities, label) => ({
  labels: label,
  datasets: [
    {
      label: 'Add tokens',
      backgroundColor: convertHex(brandInfo, 10),
      borderColor: brandInfo,
      pointHoverBackgroundColor: '#fff',
      borderWidth: 2,
      data: addTokenActivities
    },
    {
      label: 'Remove tokens',
      backgroundColor: 'transparent',
      borderColor: brandDanger,
      pointHoverBackgroundColor: '#fff',
      borderWidth: 2,
      data: removeTokenActivities
    }
  ]
})

const mainChartOpts = {
  maintainAspectRatio: false,
  legend: {
    display: false
  },
  scales: {
    xAxes: [{
      gridLines: {
        drawOnChartArea: false,
      }
    }],
    yAxes: [{
      ticks: {
        beginAtZero: true,
        maxTicksLimit: 5,
        // stepSize: Math.ceil(250 / 5),
        // max: 20
      }
    }]
  },
  elements: {
    point: {
      radius: 0,
      hitRadius: 10,
      hoverRadius: 4,
      hoverBorderWidth: 3,
    }
  }
}

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.renderFilterType = this.renderFilterType.bind(this);
    this.onTokenHistoryChanged = this.onTokenHistoryChanged.bind(this);
    this.getChartData = this.getChartData.bind(this);
    this.getChartItemIndex = this.getChartItemIndex.bind(this);
    this.onFilterClick = this.onFilterClick.bind(this);
    this.getTotalAddToken = this.getTotalAddToken.bind(this);
    this.getTotalRemoveToken = this.getTotalRemoveToken.bind(this);

    this.addTokenActivities = [];
    this.removeTokenActivities = [];

    this.filterTypes = ['Day', 'Week', 'Month']
    this.state = { filterType: 'Day' };
  }

  componentWillMount() {
    database().ref('tokenHistory').on('value', this.onTokenHistoryChanged);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.filterType !== prevState.filterType) {
      database().ref('tokenHistory').once('value', this.onTokenHistoryChanged);
    }
  }

  componentWillUnmount() {
    database().ref('tokenHistory').off('value', this.onTokenHistoryChanged);
  }

  getChartData() {
    const { state: { filterType }, addTokenActivities, removeTokenActivities } = this;

    return initChartData(
      [...addTokenActivities],
      [...removeTokenActivities],
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

  onTokenHistoryChanged(parentSnapshot) {
    this.addTokenActivities = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.removeTokenActivities = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    parentSnapshot.forEach((parent) => {
      const { state: { filterType }, addTokenActivities, removeTokenActivities, getChartItemIndex } = this;
      const condition = filterType === 'Day' ? 'd' : filterType === 'Week' ? 'w' : 'M';
      const startAt = moment().startOf(condition).format('x') * 1;
      const endAt = moment().endOf(condition).format('x') * 1;

      parent.ref.orderByChild('timeStamp').startAt(startAt).endAt(endAt).once('value')
        .then((child) => {
          child.forEach((snap) => {
            const { type, timeStamp } = snap.val();
            const index = getChartItemIndex(timeStamp);
            const activies = (type === 'add' ? addTokenActivities : removeTokenActivities);
            activies[index] += 1;
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

  render() {
    return (
      <div className="animated fadeIn">
        <Row>
          <Col>
            <Card>
              <CardBlock className="card-body">
                <Row>
                  <Col sm="5">
                    <CardTitle className="mb-0">User activies</CardTitle>
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
                    <div className="text-muted">Add tokens</div>
                    <strong>{this.getTotalAddToken()} times</strong>
                    <Progress className="progress-xs mt-2" color="info" value="100" />
                  </li>
                  <li className="d-none d-md-table-cell">
                    <div className="text-muted">Remove tokens</div>
                    <strong>{this.getTotalRemoveToken()} times</strong>
                    <Progress className="progress-xs mt-2" color="danger" value="100" />
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
