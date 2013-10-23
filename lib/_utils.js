/* jshint eqnull: true */

module.exports = {
  // https://github.com/edtsech/underscore.string
  endsWith: function (str, ends){
    if (ends === '') { return true; }
    if (str == null || ends == null) { return false; }
    str = String(str); ends = String(ends);
    return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
  },

  normalizeDir: function (name) {
    if (! this.endsWith(name, '/')) {
      name = name + '/';
    }
    return name;
  }
};