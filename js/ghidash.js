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
    spinner = new Spinner();

  var _issueAggregator = function (issues) {
    var result = {count: issues.length, people: {}},
        people = result.people;

    people['[nobody]'] = 0;
    issues.each(function (issue) {
      var assignee = issue.get('assignee');
      assignee = assignee && assignee.login;
      if (!assignee) people['[nobody]']  += 1;
      else people[assignee] = (people[assignee] || 0) + 1;
    });
    drawIssueChart(result);
  };

  function drawIssueChart(data) {
    spinner.stop();
    var people = data.people,
      chart = new Highcharts.Chart({
        chart: {
          renderTo: 'container',
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false
        },
        title: {
          text: data.count + ' open issues for project'
        },
        tooltip: {
          formatter: function () {
            return '<b>' + this.point.name + '</b>: ' + this.y;
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
                return '<b>' + this.point.name + '</b>: ' +
                       Math.round(this.percentage * 100) / 100 + ' %';
              }
            }
          }
        },
        series: [
          {
            type: 'pie',
            name: 'People distribution',
            data: _.chain(people).keys().map(function (k) {
              return [k, people[k]]
            }).value()
          }
        ]
      });
  }

  function loadIssues(user, repo) {
    spinner.spin($('#container')[0]);
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
