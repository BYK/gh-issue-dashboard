(function (global, undefined) {
  // The top-level namespace. All public interface will be attached to this.
  // Exported for both CommonJS and the browser.
  var GitHub;
  if (global.exports !== undefined) {
    GitHub = exports;
  } else {
    GitHub = global.GitHub = {};
  }

  GitHub.Collection = Backbone.Collection.extend({
    sync: function (method, model, options) {
      options.dataType = 'jsonp';
      if (!options.url) {
        options.url = 'https://api.github.com' + this.url;
      }
      return Backbone.sync(method, model, options);
    },
    fetch: function (options) {
      options = _.defaults(options, {cache: true});
      var success = options.success;
      options.success = function (self, resp) {
        var next = (resp.meta.Link &&
                    resp.meta.Link.filter(function (item) {
                      return item[1].rel === 'next'
                    }));
        if (next && next.length) {
          options.add = true;
          options.success = success;
          options.url = next[0][0];
          self.fetch(options);
        } else if (success) {
          success(self, resp)
        }
      };
      return GitHub.Collection.__super__.fetch.call(this, options);
    },
    parse: function (resp, xhr) {
      return resp.data;
    }
  });

  GitHub.Issues = GitHub.Collection.extend({
    url: _.template('/repos/<%= user %>/<%= repo %>/issues?per_page=100&<%= query %>'),
    initialize: function (models, options) {
      var query = options.query;
      if (_.isObject(query)) {
        options.query = _.chain(query).keys().
          map(
          function (k) {return k + '=' + query[k]}).value().join('&');
      }
      this.url = this.url(options);
    }
  });
})(this);
