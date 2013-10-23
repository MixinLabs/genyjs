var Handlebars = require('handlebars'),
            fs = require('fs-extra'),
             _ = require('./_utils'),
             Geny, Jail;




Geny = function (ctrl) {
 this.ctrl = ctrl;
};

Geny.prototype.create = function () {
 var rootDir = this.rootDir = arguments[0],
     args    = this.args = Array.prototype.splice.call(arguments, 1),
     jail    = new Jail(rootDir);

 this.ctrl.apply(jail, args);

 return this;
};

Geny.prototype.destroy = function () {
  var boomJail = new Jail(this.rootDir, { destroy: true });  // self-destructing jail

  this.ctrl.apply(boomJail, this.args);

  return this;
};

// "jail" for `this` scope, used in #dir(), #file() methods
Jail = function (rootDir, opts) {
  this.rootDir = _.normalizeDir(rootDir);
  this.opts = opts || {};
};

Jail.prototype.dir = function (name, fn) {
  var target = this.rootDir + name;

  name = _.normalizeDir(name);

  if (this.opts.destroy) {
    fs.removeSync(target);
  } else {
    fs.mkdirpSync(target);
  }
  if (fn) {
    fn.call(new Jail(target, this.opts));
  }
};

Jail.prototype.file = function (name, opts) {
  var data     = opts.data,
      target   = this.rootDir + name,
      template = opts.template;

  
  // Better error message on compile
  switch (typeof(template)) {
    case 'string':
      template = Handlebars.compile(template);
      break;
    case 'function':
      break;
    default:
      throw new Error('template should be either a Handlebars function or a string');
  }

  if (this.opts.destroy) {
    fs.removeSync(target);
  } else {
    fs.outputFileSync(target, template(data));
  }
};



var genyFactory = function (ctrl) {
  return new Geny(ctrl);
};

// http://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase
genyFactory.camelCased = function (s) {
  return s.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
};
genyFactory.dasherized = function (s) {
  return s.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '-' + g[1].toLowerCase(); });
};

module.exports = genyFactory;