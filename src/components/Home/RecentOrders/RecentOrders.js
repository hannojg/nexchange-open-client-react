import React, { Component } from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-i18next';
import axios from 'axios';
import moment from 'moment/min/moment-with-locales.min.js';
import 'moment/locale/en-gb';
import _ from 'lodash';

import urlParams from 'Utils/urlParams';
import config from 'Config';

import LoadingComponent from './LoadingComponent/LoadingComponent';
import styles from './RecentOrders.scss';

class RecentOrders extends Component {
  state = {
    orders: [],
  };

  fetchRecentOrders = (coinsInfo = this.props.coinsInfo) => {
    let params = urlParams(),
      depositCurrencies = coinsInfo.filter(coin => coin.is_quote_of_enabled_pair),
      receiveCurrencies = coinsInfo.filter(coin => coin.is_base_of_enabled_pair);

    if (params && params.hasOwnProperty('test')) {
      depositCurrencies = coinsInfo.filter(coin => coin.is_quote_of_enabled_pair_for_test);
      receiveCurrencies = coinsInfo.filter(coin => coin.is_base_of_enabled_pair_for_test);
    }

    depositCurrencies = depositCurrencies.map(coin => coin.code);
    receiveCurrencies = receiveCurrencies.map(coin => coin.code);

    axios
      .get(`${config.API_BASE_URL}/orders/?page=1`)
      .then(response => {
        let orders = response.data.results.filter(order => {
          return params && params.hasOwnProperty('test')
            ? true
            : _.contains(receiveCurrencies, order.pair.base.code) && _.contains(depositCurrencies, order.pair.quote.code);
        });

        this.setState({ orders: orders });
      })
      .catch(error => {
        console.log(error);
      });

    this.timeout = setTimeout(() => {
      this.fetchRecentOrders();
    }, config.RECENT_ORDERS_INTERVAL);
  };

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.coinsInfo.length === 0 && nextProps.coinsInfo.length > 0) {
      this.fetchRecentOrders(nextProps.coinsInfo);
    }
  }

  render() {
    let orders = this.state.orders.slice(0, config.RECENT_ORDERS_COUNT).map(order => {
      return (
	  <I18n ns="translations">
		{(t, { i18n }) => (
        <div key={order.unique_reference} className={styles.row}>
          <div className={`${styles.col} col col-xs-3`}>
            <div className={styles.middle}>
              <p className={styles.ago}>{new moment(order.created_on).locale(`${i18n.language}`).fromNow()}</p>
            </div>
          </div>

          <div className={`${styles.col} col col-xs-6`}>
            <div className={styles.middle}>
              <div className={styles.coin}>
                <i className={`${styles.icon} coin-icon cc ${order.pair.quote.code}`} />
                <span className={`${styles.code} hidden-xs`}>{order.pair.quote.code}</span>
                <span className={styles.amount}>{Math.round(parseFloat(order.amount_quote) * 1000) / 1000}</span>
              </div>

              <i className={`${styles.arrow} fas fa-arrow-right`} aria-hidden="true" />

              <div className={styles.coin}>
                <i className={`${styles.icon} coin-icon cc ${order.pair.base.code}`} />
                <span className={`${styles.code} hidden-xs`}>{order.pair.base.code}</span>
                <span className={styles.amount}>{Math.round(parseFloat(order.amount_base) * 1000) / 1000}</span>
              </div>
            </div>
          </div>

          <div className={`${styles.col} col col-xs-3`}>
            <div className={styles.middle}>
              <a href={`${config.API_BASE_URL}/orders/${order.unique_reference}`} target="_blank" className={styles.btn}>
                {t('recentorders.3')}
              </a>
            </div>
          </div>
        </div>
		)}</I18n>
      );
    });

    return (
	<I18n ns="translations">
	{(t) => (
      <div className={styles.container}>
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <h2 className="title">{t('recentorders.1')}</h2>

              <div className="recent-orders-container">{orders.length < 1 ? <LoadingComponent isLoading={true} /> : orders}</div>
            </div>
          </div>
        </div>
      </div>
	)}</I18n>
    );
  }
}

const mapStateToProps = ({ coinsInfo }) => ({ coinsInfo });

export default connect(mapStateToProps)(RecentOrders);
