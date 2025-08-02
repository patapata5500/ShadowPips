// ShadowPips - main.js
// メインのチャート描画・機能ファイル

import * as echarts from 'echarts';
import { fetchMarketOrders, generatePrediction } from './orders';

const chart = echarts.init(document.getElementById('chart'));

let option = {
  backgroundColor: '#111',
  title: {
    text: 'ShadowPips - USD/JPY',
    textStyle: { color: '#fff' }
  },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: [],
    axisLabel: { color: '#fff' }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#fff' }
  },
  series: [
    {
      name: 'Price',
      type: 'candlestick',
      data: [],
    },
    {
      name: 'SMA(25)',
      type: 'line',
      data: [],
      lineStyle: { color: '#00f' }
    },
    {
      name: 'BB Upper',
      type: 'line',
      data: [],
      lineStyle: { color: '#0f0', type: 'dashed' }
    },
    {
      name: 'BB Lower',
      type: 'line',
      data: [],
      lineStyle: { color: '#0f0', type: 'dashed' }
    }
  ]
};

chart.setOption(option);

// データ更新関数
async function updateChart() {
  const candleData = await fetch('/data/usdjpy_1h.json').then(res => res.json());
  const sma = calculateSMA(candleData, 25);
  const bb = calculateBB(candleData);

  chart.setOption({
    xAxis: { data: candleData.map(d => d.time) },
    series: [
      { data: candleData.map(d => [d.open, d.close, d.low, d.high]) },
      { data: sma },
      { data: bb.upper },
      { data: bb.lower },
    ]
  });

  const orders = await fetchMarketOrders();
  overlayMarketOrders(chart, orders);
  generatePrediction(chart, candleData);
}

setInterval(updateChart, 10000);
updateChart();

function calculateSMA(data, period) {
  let sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      sma.push('-');
    } else {
      const sum = data.slice(i - period, i).reduce((a, b) => a + b.close, 0);
      sma.push((sum / period).toFixed(2));
    }
  }
  return sma;
}

function calculateBB(data) {
  let upper = [], lower = [];
  const period = 25;
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      upper.push('-');
      lower.push('-');
    } else {
      const slice = data.slice(i - period, i);
      const avg = slice.reduce((a, b) => a + b.close, 0) / period;
      const std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b.close - avg, 2), 0) / period);
      upper.push((avg + std * 2).toFixed(2));
      lower.push((avg - std * 2).toFixed(2));
    }
  }
  return { upper, lower };
}

function overlayMarketOrders(chart, orders) {
  const markLines = orders.map(o => ({
    yAxis: o.price,
    label: { formatter: o.label, color: '#ff0' },
    lineStyle: { color: '#f80' }
  }));
  chart.setOption({
    graphic: markLines.map(line => ({
      type: 'text',
      left: '10',
      top: `${Math.random() * 90}%`,
      style: {
        text: line.label.formatter,
        fill: line.label.color,
        font: '12px sans-serif'
      }
    }))
  });
}
