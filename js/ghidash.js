(function (global, undefined) {
  // The top-level namespace. All public interface will be attached to this.
  // Exported for both CommonJS and the browser.
  var GHIDash;
  if (global.exports !== undefined) {
    GHIDash = exports;
  } else {
    GHIDash = global.GHIDash = {};
  }
  var $ = global.jQuery,
      spinner = new Spinner(),
      span = 30 * 24 * 3600 * 1000, /* 30 days in milliseconds */
      rankChar = '\u2605', /* ★ character */
      chartOptions = {
        chart: {
          type: 'pie',
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false
        },
        tooltip: {
          formatter: function () {
            return '<b>' + this.point.name + '</b>: ' +
                   Math.round(this.percentage * 100) / 100 + ' %';
          }
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              color: '#000000',
              connectorColor: '#000000',
              formatter: function () {
                return '<b>' + this.point.name + '</b>: ' + this.y;
              }
            }
          }
        }
      };
  
  var toChartData = function (data) {
    return _.zip(_.keys(data), _.values(data));
  };
  var getScore = function(memo, char) {
    if (char === rankChar) ++memo;
    return memo;
  };
  var scoreCalculator = function(label) {
    var res = _.reduce(label.name.split(''), getScore, 0);
    return res;
  };
  var _issueAggregator = function (issues) {
    var result = {count: issues.length, people: {}, scores: {}},
        people = result.people,
        scores = result.scores;

    issues.each(function (issue) {
      var labels = issue.get('labels'),
          score = labels.length && _.max(_.map(labels, scoreCalculator)) || 0.5;
          assignee = issue.get('assignee');
      assignee = assignee && assignee.login || '[nobody]';
      issue.score = score;
      
      scores[score] = (scores[score] || 0) + 1;
      people[assignee] = (people[assignee] || 0) + score;
    });
    drawIssueChart(result);
  };

  function drawIssueChart(data) {
    spinner.stop();
    var peopleChart = new Highcharts.Chart(_.extend(chartOptions, {
          chart: _.extend(chartOptions.chart, {renderTo: 'peopleChart'}),
          title: { text: data.count + ' open issues for project' },
          series: [{
              name: 'People\'s workload',
              data: toChartData(data.people)
            }]
        })),
        scoresChart = new Highcharts.Chart(_.extend(chartOptions, {
          chart: _.extend(chartOptions.chart, {renderTo: 'scoresChart'}),
          title: { text: data.count + ' open issues for project' },
          series: [{
                     name: 'Priority distribution',
                     data: toChartData(data.scores)
                   }]
        }));
  }

  function loadIssues(user, repo) {
    spinner.spin($('#peopleChart')[0]);
    var issues = new GitHub.Issues([],
      {user: user, repo: repo, query: {status: 'open'}});
    issues.fetch({ success: _issueAggregator});
  }

  $(document).ready(function ($) {
    var hash = document.location.hash.substr(1);
    if (hash == "") {
      // initialize your app
    } else if (hash[0] === '!') {
      var params = hash.substr(1).split('/'),
        title = $('h1'),
        titleTemplate = _.template(title.text())
      title.text(titleTemplate({user: params[0], repo: params[1]}));
      loadIssues.apply($, params);
    }
  });
})(this);
