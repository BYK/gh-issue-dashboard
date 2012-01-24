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
    var result = {count: issues.length, labels: {}},
        labels = result.labels;

    labels['[unlabeled]'] = 0;
    issues.each(function (issue) {
      var iLabels = issue.get('labels'),
          length = iLabels.length;
      if (length) labels['[unlabeled]']  += 1;
      for (var i = iLabels.length - 1; i >= 0; i--) {
        var label = iLabels[i].name;
        labels[label] = (labels[label] || 0) + 1/length;
      }
    });
    drawIssueChart(result);
  };

  function drawIssueChart(data) {
    spinner.stop();
    var labels = data.labels,
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
            name: 'Label share',
            data: Object.keys(labels).map(function (k) {
              return [k, labels[k]]
            })
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
      loadIssues.apply($, hash.substr(1).split('/'))
    }
  });
})(this);
